# PDF to Image + Tesseract OCR extraction
$ErrorActionPreference = "Continue"

$pdfPath = "E:\vehicle-finance-app\F51 to F100.pdf"
$outputDir = "E:\vehicle-finance-app\pdf_images"
$tesseract = "C:\Program Files\Tesseract-OCR\tesseract.exe"
$outputTxt = "E:\vehicle-finance-app\F51_to_F100_extracted.txt"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

Write-Host "Loading Windows Runtime..."

Add-Type -AssemblyName System.Runtime.WindowsRuntime

# Load WinRT types
[Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.DataWriter, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null

# Get the generic AsTask method for IAsyncOperation<T>
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetGenericArguments().Count -eq 1
})[0]

Function WaitForResult($asyncOp, $resultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($resultType)
    $netTask = $asTask.Invoke($null, @($asyncOp))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

# For IAsyncAction (void return), we cast differently
Function WaitForAction($asyncAction) {
    # Cast COM object to IAsyncAction explicitly
    $iasyncAction = [System.Runtime.InteropServices.WindowsRuntime.WindowsRuntimeMarshal]
    # Use reflection to find the right AsTask overload
    $methods = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetGenericArguments().Count -eq 0
    }
    foreach ($m in $methods) {
        try {
            $netTask = $m.Invoke($null, @($asyncAction))
            $netTask.Wait(-1) | Out-Null
            return
        } catch {
            continue
        }
    }
    # Fallback: just wait on the COM object
    Start-Sleep -Milliseconds 500
}

Write-Host "Reading PDF into memory..."
$pdfBytes = [System.IO.File]::ReadAllBytes($pdfPath)
Write-Host "PDF size: $([math]::Round($pdfBytes.Length / 1MB, 2)) MB"

# Write bytes into WinRT stream
$memStream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
$writer = New-Object Windows.Storage.Streams.DataWriter($memStream.GetOutputStreamAt(0))
$writer.WriteBytes($pdfBytes)

# StoreAsync returns IAsyncOperation<uint32>
$storeResult = WaitForResult ($writer.StoreAsync()) ([uint32])
Write-Host "Stored $storeResult bytes to stream"

# FlushAsync returns IAsyncOperation<bool>
$flushResult = WaitForResult ($writer.FlushAsync()) ([bool])
Write-Host "Flushed: $flushResult"

# LoadFromStreamAsync returns IAsyncOperation<PdfDocument>
Write-Host "Loading PDF document from stream..."
$pdfDoc = WaitForResult ([Windows.Data.Pdf.PdfDocument]::LoadFromStreamAsync($memStream)) ([Windows.Data.Pdf.PdfDocument])

$pageCount = $pdfDoc.PageCount
Write-Host "PDF has $pageCount pages"

# Initialize output file
@"
EXTRACTED TEXT FROM: F51 to F100.pdf
Total Pages: $pageCount
Extracted On: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
====================================================
"@ | Set-Content -Path $outputTxt -Encoding UTF8

for ($i = 0; $i -lt $pageCount; $i++) {
    $pageNum = $i + 1
    Write-Host "Page $pageNum/$pageCount..." -NoNewline

    try {
        $page = $pdfDoc.GetPage($i)
        $renderStream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream

        # Render options for high quality
        $renderOptions = New-Object Windows.Data.Pdf.PdfPageRenderOptions
        $renderOptions.DestinationWidth = [uint32]($page.Size.Width * 3)
        $renderOptions.DestinationHeight = [uint32]($page.Size.Height * 3)

        # RenderToStreamAsync returns IAsyncAction
        $renderAction = $page.RenderToStreamAsync($renderStream, $renderOptions)
        WaitForAction $renderAction

        # Read rendered image
        $imgPath = Join-Path $outputDir "page_$($pageNum.ToString('D3')).png"
        $renderStream.Seek(0)
        $reader = New-Object Windows.Storage.Streams.DataReader($renderStream.GetInputStreamAt(0))
        $loadSize = WaitForResult ($reader.LoadAsync([uint32]$renderStream.Size)) ([uint32])
        $imgBytes = New-Object byte[] $renderStream.Size
        $reader.ReadBytes($imgBytes)
        [System.IO.File]::WriteAllBytes($imgPath, $imgBytes)

        $reader.Dispose()
        $renderStream.Dispose()
        $page.Dispose()

        # Run Tesseract OCR
        $ocrBase = Join-Path $outputDir "page_$($pageNum.ToString('D3'))_ocr"
        & $tesseract $imgPath $ocrBase -l eng --psm 6 2>$null

        $ocrFile = "$ocrBase.txt"
        if (Test-Path $ocrFile) {
            $ocrText = Get-Content $ocrFile -Raw -Encoding UTF8
            $imgSize = [math]::Round(([System.IO.FileInfo]$imgPath).Length / 1KB)
            Add-Content -Path $outputTxt -Value "`n================================================================================`nPAGE $pageNum`n----------------------------------------`n$ocrText" -Encoding UTF8
            Write-Host " OK (${imgSize}KB)"
        } else {
            Write-Host " No OCR output"
            Add-Content -Path $outputTxt -Value "`n== PAGE $pageNum == [No OCR output]" -Encoding UTF8
        }
    } catch {
        Write-Host " ERROR: $($_.Exception.Message)"
        Add-Content -Path $outputTxt -Value "`n== PAGE $pageNum == [Error: $($_.Exception.Message)]" -Encoding UTF8
    }
}

$writer.Dispose()
$memStream.Dispose()

Write-Host "`nDone! Output: $outputTxt"
