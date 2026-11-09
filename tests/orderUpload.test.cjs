const { test } = require("node:test")
const assert = require("node:assert/strict")
const { File } = require("node:buffer")
const JSZip = require("jszip")
const { prepareOrderUpload } = require("../.test-build/orderUpload.js")

test("Burger King single workbook keeps its source filename and raw bytes", async () => {
    const file = new File(["workbook"], "Order.v1.xlsx")
    const result = await prepareOrderUpload([file], "burgerking")
    assert.equal(result.filename, file.name)
    assert.equal(result.body, file)
})

test("Burger King batches retain every workbook with its original name and content", async () => {
    const result = await prepareOrderUpload([new File(["one"], "North.xlsx"), new File(["two"], "South.xlsx")], "burgerking")
    assert.match(result.filename, /^burgerking_batch_.*\.zip$/)
    const zip = await JSZip.loadAsync(await result.body.arrayBuffer())
    assert.deepEqual(Object.keys(zip.files), ["North.xlsx", "South.xlsx"])
    assert.equal(await zip.file("North.xlsx").async("string"), "one")
    assert.equal(await zip.file("South.xlsx").async("string"), "two")
})

test("Existing ZIP is passed through unchanged", async () => {
    const file = new File(["archive"], "Orders.ZIP")
    const result = await prepareOrderUpload([file], "burgerking")
    assert.equal(result.filename, "Orders.ZIP")
    assert.equal(result.body, file)
})

test("Duplicate Burger King filenames cannot silently overwrite an order", async () => {
    await assert.rejects(prepareOrderUpload([new File(["one"], "Order.xlsx"), new File(["two"], "ORDER.XLSX")], "burgerking"), /distinct filenames/)
})

test("DWP still archives even one workbook and other converters keep their filename convention", async () => {
    const file = new File(["one"], "Order.v1.xlsx")
    const dwp = await prepareOrderUpload([file], "dwp")
    assert.match(dwp.filename, /^dwp_batch_/)
    const zip = await JSZip.loadAsync(await dwp.body.arrayBuffer())
    assert.equal(await zip.file(file.name).async("string"), "one")
    const other = await prepareOrderUpload([file], "single")
    assert.equal(other.filename, "Order.v1")
    assert.equal(other.body, file)
})
