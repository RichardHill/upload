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
    const [email, setEmail] = React.useState()

    const handleChange = (event: any) => {
        setSelectedValue(event.target.value)
    }

    const onDrop = React.useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
        }
    }, [])

    const fileNameWithoutExtension = file?.name.split(".").slice(0, -1).join(".")

    const onButtonClick = async () => {
        if (file) {
            try {
                const response = await fetch(`https://api.greencloud.dev/gc/c279f9bf643e47dc8ad9694d9e53a302/?email=${email}&filename=` + fileNameWithoutExtension, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/octet-stream",
                    },
                    body: file,
                })

                const responseData = await response.json()
                console.log(responseData)
            } catch (error) {
                console.error("Error:", error)
            }
        }
    }
    const { acceptedFiles, getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } = useDropzone({
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
        maxFiles: 1,
        onDrop,
    })

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
                        <input readOnly className="h-6 ml-2 pl-2 w-64" type="text" value={file?.name || ""} />
                    </div>
                    <div className="mt-2 flex">
                        <h3>Client:</h3>
                        <div>
                            <select className="bg-white ml-2 pl-2 h-6 w-64" value={selectedValue} onChange={handleChange}>
                                <option value="">Select an option</option>
                                <option value="option1">McDonalds&apos;s</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-2 flex">
                        <h3>Email:</h3>
                        <input className="h-6 ml-3 pl-2 w-64" type="text" value={email || ""} onChange={(e: any) => setEmail(e.target.value)} />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onButtonClick}
                    className="mt-5 ml-20 bg-[#3b71ca] inline-block rounded bg-info px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#54b4d3] transition duration-150 ease-in-out hover:bg-info-600 hover:shadow-[0_8px_9px_-4px_rgba(84,180,211,0.3),0_4px_18px_0_rgba(84,180,211,0.2)] focus:bg-info-600 focus:shadow-[0_8px_9px_-4px_rgba(84,180,211,0.3),0_4px_18px_0_rgba(84,180,211,0.2)] focus:outline-none focus:ring-0 active:bg-info-700 active:shadow-[0_8px_9px_-4px_rgba(84,180,211,0.3),0_4px_18px_0_rgba(84,180,211,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(84,180,211,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(84,180,211,0.2),0_4px_18px_0_rgba(84,180,211,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(84,180,211,0.2),0_4px_18px_0_rgba(84,180,211,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(84,180,211,0.2),0_4px_18px_0_rgba(84,180,211,0.1)]"
                >
                    Upload
                </button>
            </section>
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
