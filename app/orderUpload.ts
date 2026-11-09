import JSZip from "jszip"

export const isZipFile = (file: File) => {
    const name = file.name.toLowerCase()
    return name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed"
}

export async function prepareOrderUpload(files: File[], kind: "single" | "dwp" | "burgerking") {
    const first = files[0]
    if (!first) throw new Error("Choose a file to upload.")
    if (kind === "single") {
        return { filename: first.name.split(".").slice(0, -1).join("."), body: first as Blob }
    }
    if (isZipFile(first)) {
        return { filename: first.name, body: first as Blob }
    }
    if (kind === "burgerking" && files.length === 1) {
        return { filename: first.name, body: first as Blob }
    }
    if (kind === "burgerking" && new Set(files.map((file) => file.name.toLowerCase())).size !== files.length) {
        throw new Error("Selected workbooks must have distinct filenames. Rename duplicate files, or upload a ZIP with separate folders.")
    }
    const zip = new JSZip()
    // Materialise File bytes explicitly: JSZip's browser FileReader path is not
    // available in every runtime, whereas File.arrayBuffer is supported by both.
    for (const file of files) zip.file(file.name, await file.arrayBuffer())
    const body = await zip.generateAsync({ type: "blob" })
    const prefix = kind === "dwp" ? "dwp" : "burgerking"
    const filename = `${prefix}_batch_${new Date().toISOString().replace(/[:.]/g, "-")}${kind === "burgerking" ? ".zip" : ""}`
    return { filename, body }
}
