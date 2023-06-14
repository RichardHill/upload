"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"

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

function StyledDropzone() {
    const [file, setFile] = React.useState<File | undefined>()
    const [selectedValue, setSelectedValue] = React.useState("option1")
    const [email, setEmail] = React.useState("")
    const [isUploading, setIsUploading] = React.useState(false)
    const [isRunning, setIsRunnig] = React.useState(false)
    const [taskID, setTaskID] = React.useState("")
    const [result, setResult] = React.useState<{ status: number; message: string }>()

    const handleChange = (event: any) => {
        setSelectedValue(event.target.value)
    }

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
        }
    }, [])

    const fileNameWithoutExtension = file?.name.split(".").slice(0, -1).join(".").replaceAll(" ", "_")

    const onButtonClick = async () => {
        if (file) {
            try {
                setIsUploading(true)
                setResult(undefined)
                setIsRunnig(false)
                const response = await fetch(`https://api.greencloud.dev/gc/c279f9bf643e47dc8ad9694d9e53a302/?email=${email}&filename=` + fileNameWithoutExtension, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/octet-stream",
                    },
                    body: file,
                })
                setIsUploading(false)
                console.log("response", response.status)
                const responseData = await response.json()
                setTaskID(responseData.id)
                console.log(responseData)
            } catch (error) {
                console.error("Error:", error)
            }
        }
    }
    const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } = useDropzone({
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
        maxFiles: 1,
        onDrop,
    })

    React.useEffect(() => {
        if (taskID === "") return
        setIsRunnig(true)

        async function getResult() {
            try {
                const response = await fetch(`https://api.greencloud.dev/gc/${taskID}/result`)
                const responseMessage = await response.text()
                if (response.status !== 404) {
                    setIsRunnig(false)
                    clearInterval(intervalId) // Clear interval when you get a 201 status
                    setResult({
                        status: response.status,
                        message: responseMessage,
                    })
                }
            } catch (error) {
                console.error("Error:", error)
            }
        }

        const intervalId = setInterval(getResult, 3000) // Call getResult every 3 seconds

        return () => clearInterval(intervalId) // Clear interval when the component unmounts
    }, [taskID])

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
            <div {...getRootProps({ style })}>
                <input {...getInputProps()} />
                <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
            </div>
            <section className="flex items-center">
                <div className="flex flex-col mt-4">
                    <div className="flex">
                        <h3>Name:</h3>
                        <input readOnly className="h-6 ml-2 pl-2 w-64 rounded" type="text" value={file?.name || ""} />
                    </div>
                    <div className="mt-2 flex">
                        <h3>Client:</h3>
                        <div>
                            <select className="bg-white ml-2 pl-2 h-6 w-64 rounded" value={selectedValue} onChange={handleChange}>
                                <option value="">Select an option</option>
                                <option value="option1">McDonalds&apos;s</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-2 flex">
                        <h3>Email:</h3>
                        <input className="h-6 ml-3 pl-2 w-64 rounded !text-black" type="email" value={email || ""} onChange={(e: any) => setEmail(e.target.value)} />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onButtonClick}
                    disabled={email === "" || !file?.name}
                    style={{ background: email === "" || !file?.name ? "gray" : "#3b71ca" }}
                    className="mt-5 ml-20 bg-[#3b71ca] inline-block rounded bg-info px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white transition duration-150 ease-in-out hover:bg-info-600"
                >
                    Upload
                    {isUploading ? (
                        <div
                            className="inline-block h-4 w-4 ml-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                            role="status"
                        >
                            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                        </div>
                    ) : null}
                </button>
            </section>
            {isRunning ? (
                <div className="mt-5">
                    Result: Running
                    <div
                        className="inline-block h-4 w-4 ml-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                    >
                        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    <h3 className="mt-5">Result: {result?.status === 200 ? "Success" : result === undefined ? "" : "Failure"}</h3>
                    <h3 className="">Message: {result?.message}</h3>
                </>
            )}
        </div>
    )
}

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <StyledDropzone />
        </main>
    )
}
