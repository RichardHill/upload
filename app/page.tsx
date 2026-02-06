"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import JSZip from "jszip"
import {
    SignOutButton
  } from '@clerk/nextjs'

const baseStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    borderWidth: 2,
    borderRadius: 2,
    borderColor: "#eeeeee",
    borderStyle: "dashed",
    backgroundColor: "#fafafa",
    color: "#bdbdbd",
    outline: "none",
    transition: "border .24s ease-in-out",
}

const focusedStyle = {
    borderColor: "#2196f3",
}

const acceptStyle = {
    borderColor: "#00e676",
}

const rejectStyle = {
    borderColor: "#ff1744",
}

const isZipFile = (file: File) => {
    const fileName = file.name.toLowerCase()
    return fileName.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed"
}

const signOutButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    right: "10px",
    padding: "10px 20px",
    backgroundColor: "#3b71ca",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
};

function StyledDropzone() {
    type OptionType = "option1" | "option2" | "option3" | "option4" | "option5" | "option6" | "option7" | "option8" | "option9" | "option10"
    const [selectedValue, setSelectedValue] = React.useState<OptionType>("option1")
    const [selectedPath, setSelectedPath] = React.useState<OptionType>("option1")
    const isDwp = selectedValue === "option9"
    const [files, setFiles] = React.useState<File[]>([])
    const [email, setEmail] = React.useState("")
    const [flagsPath, setFlagsPath] = React.useState("")
    const [sortColumn, setSortColumn] = React.useState("")
    const [itemCount, setItemCount] = React.useState("")
    const [sheetCount, setSheetCount] = React.useState("")
    const [isUploading, setIsUploading] = React.useState(false)
    const [isRunning, setIsRunning] = React.useState(false)
    const [taskID, setTaskID] = React.useState("")
    const [result, setResult] = React.useState<{ status: number; message: string }>()
    const hasZipFile = files.some(isZipFile)

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const handleChange = (event: any) => {
        if (event.target.value === "option1") {
            setFlagsPath("C:\\Flags\\")
        } else {
            setFlagsPath("")
        }
        setSelectedValue(event.target.value)
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const handlePathChange = (event: any) => {
        setSelectedPath(event.target.value)
        //setSelectedValue(event.target.value)
        setFlagsPath(event.target.value)
    }

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return
        if (!isDwp) {
            setFiles([acceptedFiles[0]])
            return
        }

        const zipFile = acceptedFiles.find(isZipFile)
        if (zipFile) {
            setFiles([zipFile])
            return
        }

        setFiles(acceptedFiles)
    }, [isDwp])

    React.useEffect(() => {
        if (!isDwp && files.length > 1) {
            setFiles((currentFiles) => currentFiles.slice(0, 1))
        }
    }, [isDwp, files.length])

    const handleRemoveFile = (index: number) => {
        setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index))
    }

    const fileDisplayValue = files.map((fileItem) => fileItem.name).join(", ")

    const onButtonClick = async () => {
        const selectedFile = files[0]
        if (selectedFile) {
            try {
                setIsUploading(true); // Start uploading process
                setResult(undefined); // Clear previous results

                const fileNameWithoutExtension = selectedFile.name.split(".").slice(0, -1).join(".").replaceAll(" ", "_")
                let uploadFileName = fileNameWithoutExtension
                let requestBody: Blob | File = selectedFile

                const isDwpZipUpload = isDwp && isZipFile(selectedFile)

                if (isDwp && !isDwpZipUpload) {
                    const zip = new JSZip()
                    files.forEach((fileItem) => {
                        zip.file(fileItem.name, fileItem)
                    })
                    requestBody = await zip.generateAsync({ type: "blob" })
                    uploadFileName = `dwp_batch_${new Date().toISOString().replace(/[:.]/g, "-")}`
                } else if (isDwpZipUpload) {
                    uploadFileName = selectedFile.name
                }
    
                const response = await fetch(
                    `https://api.greencloud.dev/gc/${getEndpoint(selectedValue)}/?email=${email}&filename=${uploadFileName}&sortcolumn=${sortColumn}&path=${flagsPath}&itemcount=${itemCount}&sheetcount=${sheetCount}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/octet-stream",
                        },
                        body: requestBody,
                    }
                );
    
                const responseData = await response.json();
                setTaskID(responseData.id); // Save task ID to fetch results later
                setIsUploading(false); // Upload is complete
            } catch (error) {
                console.error("Error:", error);
                setIsUploading(false); // Ensure spinner hides on error
            }
        }
    };
    const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } = useDropzone({
        accept: { 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx", ".tsv"],
            "application/zip": [".zip"]
        },
        multiple: isDwp && !hasZipFile,
        ...(isDwp ? {} : { maxFiles: 1 }),
        onDrop,
    })

    React.useEffect(() => {
        if (!taskID) return; // Do nothing if taskID isn't set yet.
    
        // biome-ignore lint/style/useConst: <explanation>
            let intervalId: string | number | NodeJS.Timeout | undefined; // Declare the intervalId outside to ensure it's accessible in the clearInterval call.
    
        async function getResult() {
            try {
                const response = await fetch(`https://api.greencloud.dev/gc/${taskID}/result`);
                const responseMessage = await response.text();
                
                // Check for non-404 status and if found, handle the response and clear the interval.
                if (response.status !== 404) {
                    setIsRunning(false); // Stop the "running" spinner
                    setResult({
                        status: response.status,
                        message: responseMessage,
                    });
                    clearInterval(intervalId); // Clear the interval upon receiving a successful response.
                }
            } catch (error) {
                console.error("Error:", error);
                clearInterval(intervalId); // Ensure the interval is cleared on error.
            }
        }
    
        setIsRunning(true); // Start the "running" spinner when waiting for results
        intervalId = setInterval(getResult, 1500); // Set up the interval to poll for results
    
        return () => {
            clearInterval(intervalId); // Clear the interval when the component unmounts or the taskID changes
        };
    }, [taskID]);

    const style = React.useMemo(
        () => ({
            ...baseStyle,
            ...(isFocused ? focusedStyle : {}),
            ...(isDragAccept ? acceptStyle : {}),
            ...(isDragReject ? rejectStyle : {}),
        }),
        [isFocused, isDragAccept, isDragReject]
    )

    return ( 
        <div className="container">
            
            <div style={signOutButtonStyle}>
                <SignOutButton />
            </div>
            {/* <div className="absolute top-0 right-0 m-4">
                    <SignOutButton />
            </div>             */}
            <Image src="/logo.jpeg" alt="logo" width={300} height={100} className="m-auto mb-8" />
            <div {...getRootProps({ style })}>
                <input {...getInputProps()} />
                <p>Drag &apos;n&apos; drop an .xlsx / .tsv / .zip file here, or click to select one.</p>
            </div>
            <section className="flex items-center">
                <div className="flex flex-col mt-4">
                    <div className="flex">
                        <h3>Name:</h3>
                        <input
                            readOnly
                            className="h-6 !ml-28 pl-2 w-64 rounded !text-black absolute"
                            type="text"
                            value={fileDisplayValue}
                        />
                    </div>
                    {isDwp ? (
                        <div className="mt-2 ml-28 w-64 rounded border border-gray-200 bg-white p-2 text-black">
                            {files.length === 0 ? (
                                <p className="text-xs text-gray-500">No files selected.</p>
                            ) : (
                                <ul className="space-y-1 text-xs">
                                    {files.map((fileItem, index) => (
                                        <li key={`${fileItem.name}-${index}`} className="flex items-center justify-between gap-2">
                                            <span className="flex min-w-0 items-center gap-2">
                                                <svg
                                                    className="h-4 w-4 flex-none text-gray-500"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M19.5 9.5V6a2 2 0 0 0-2-2h-7L5 9.5V18a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-8.5Z"
                                                    />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 4v5.5H5" />
                                                </svg>
                                                <span className="truncate">{fileItem.name}</span>
                                            </span>
                                            <button
                                                type="button"
                                                className="text-gray-500 hover:text-red-600"
                                                onClick={() => handleRemoveFile(index)}
                                                aria-label={`Remove ${fileItem.name}`}
                                            >
                                                X
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : null}
                    <div className="mt-2 flex">
                        <h3>Client:</h3>
                        <div>
                            <select
                                className="bg-white ml-16 pl-2 h-6 w-64 rounded absolute"
                                value={selectedValue}
                                onChange={handleChange}
                            >
                                <option value="">Select an option</option>
                                <option value="option1">
                                    Orders - British Airways
                                </option>
                                <option value="option2">
                                    Orders - McDonalds
                                </option>
                                <option value="option3">
                                    Orders - BUPA Webshop
                                </option>
                                <option value="option4">
                                    Orders - ALDI
                                </option>
                                <option value="option5">
                                    Orders - Greggs
                                </option>
                                <option value="option9">
                                    Orders - DWP
                                </option>
                                <option value="option10">
                                    Orders - NHS Shropshire
                                </option>
                                <option value="option6">
                                    Month End - McDonalds
                                </option>
                                <option value="option7">
                                    Month End - BUPA
                                </option>
                                <option value="option8">
                                    Adhoc - Customer Sort
                                </option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-2 flex">
                        <h3>Email:</h3>
                        <select
                            className="bg-white ml-28 pl-2 h-6 w-64 rounded absolute !text-black"
                            value={email}
                            onChange={(e: any) => setEmail(e.target.value)}
                        >
                            <option value="">Enter manually...</option>
                            <option value="RHopeJones@re-trade.co.uk">RHopeJones@re-trade.co.uk</option>
                            <option value="Danar@re-trade.co.uk">Danar@re-trade.co.uk</option>
                            <option value="Orders@Rec-Express.co.uk">Orders@Rec-Express.co.uk</option>
                            <option value="manchester@re-trade.co.uk">manchester@re-trade.co.uk</option>

                        </select>
                    </div>
                    <div className="mt-2 flex">
                        <h3>Custom Email:</h3>
                        <input
                            className="h-6 ml-28 pl-2 w-64 rounded !text-black absolute"
                            type="email"
                            value={email}
                            onChange={(e: any) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                        />
                    </div>
                    {selectedValue === "option1" ? (
                        <>
                            <div className="mt-2 flex">
                                <h3>Flags path:</h3>
                                <select className="bg-white ml-28 pl-2 h-6 w-64 rounded absolute" value={selectedPath} onChange={handlePathChange}>
                                    <option value="">Select a path</option>
                                    <option value="C:\">C:\</option>
                                    <option value="C:\BA\">C:\BA\</option>
                                </select>
                            </div>

                            {selectedValue === "option1" ? (
                            <>
                            <div className="mt-2 flex">
                                <h3>Item count:</h3>
                                <input
                                    className="h-6 ml-28 pl-2 w-64 rounded !text-black absolute"
                                    type="number"
                                    value={itemCount || ""}
                                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                                    onChange={(e: any) => setItemCount(e.target.value)}
                                />
                            </div>
                            <div className="mt-2 flex">
                                <h3>Sheet count:</h3>
                                <input
                                    className="h-6 ml-28 pl-2 w-64 rounded !text-black absolute"
                                    type="number"
                                    value={sheetCount || ""}
                                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                                    onChange={(e: any) => setSheetCount(e.target.value)}
                                />
                            </div>
                            </>
                            ) : null }
                        </>
                    ) : null}
                    { selectedValue === "option8" ? ( 
                        <> 
                            <div className="mt-2 flex">
                                <h3>Sort Column:</h3>
                                <input
                                    className="h-6 ml-28 pl-2 w-64 rounded !text-black absolute"
                                    type="text"
                                    value={sortColumn || ""}
                                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                                    onChange={(e: any) => setSortColumn(e.target.value)}
                                />
                            </div>
                        </> ) : null }
                </div>
                <button
                    type="button"
                    onClick={onButtonClick}
                    disabled={email === "" || files.length === 0}
                    style={{ background: email === "" || files.length === 0 ? "gray" : "#3b71ca" }}
                    className="mt-5 ml-96 bg-[#3b71ca] inline-block rounded bg-info px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white transition duration-150 ease-in-out hover:bg-info-600"
                >
                    Upload
                    {isUploading ? (
                        <div
                            className="inline-block h-4 w-4 ml-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                            // biome-ignore lint/a11y/useSemanticElements: <explanation>
                            role="status"
                        >
                            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                                Loading...
                            </span>
                        </div>
                    ) : null}
                </button>
            </section>
            {isRunning ? (
                <div className="mt-5">
                    Result: Running
                    {/* biome-ignore lint/a11y/useSemanticElements: <explanation> */}
                     <div className="inline-block h-4 w-4 ml-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                            Loading...
                        </span>
                    </div>
                </div>
                ) : (
                <>
                    <h3 className="mt-5">
                        Result: {result?.status === 200 ? "Success" : result === undefined ? "" : "Failure"}
                    </h3>
                    <h3 className="">Message: {result?.message}</h3>
                </>
            )}
        </div>
    )
}

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-16">
            <StyledDropzone />
        </main>
    )
}

type OptionType = "option1" | "option2" | "option3" | "option4" | "option5" | "option6" | "option7" | "option8" | "option9" | "option10"
function getEndpoint(option: OptionType) {

    const endpoints = {
        // option1: "662832e662090083d0ae5a39",  // British Airways Badges
        // option2: "664c6a8272c30de86115f0b9",  // McDonald's Processing
        // option3: "669e241374ef529b85830ad1",  // McDonalds Month End XLSX
        // option4: "66282dea1869be1ba9c0fb54",  // BUPA Month End
        // option5: "662830bd62090083d0ae5a37",  // BUPA Webshop
        // option6: "6628303362090083d0ae5a35",  // ALDI
        // option7: "6628cd5c62090083d0ae5a48",  // Greggs
        // option8: "66282f7b72a0222a1942089e",  // Customer Sort

        option1: "662832e662090083d0ae5a39",  // British Airways Badges
        option2: "664c6a8272c30de86115f0b9",  // McDonald's Processing
        option3: "662830bd62090083d0ae5a37",  // BUPA Webshop
        option4: "6628303362090083d0ae5a35",  // ALDI
        option5: "6628cd5c62090083d0ae5a48",  // Greggs
        option6: "669e241374ef529b85830ad1",  // McDonalds - Month End 
        option7: "66282dea1869be1ba9c0fb54",  // BUPA - Month End        
        option8: "66282f7b72a0222a1942089e",  // Customer Sort
        option9: "69653668a26f8a90a0b61920",  // DWP - Orders
        option10: "6986346a6ba7a21c454803ab",  // NHS Shropshire - Orders

    }

    return endpoints[option]
}
