
import pypdf

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    with open("extracted_toc_start.txt", "w", encoding="utf-8") as f:
        # Extract pages 3 to 10 to get the start of TOC
        for i in range(2, 11): # Pages are 0-indexed
            text = reader.pages[i].extract_text()
            f.write(f"\n--- Page {i+1} ---\n")
            f.write(text)
    print("Extraction complete.")
except Exception as e:
    print(f"Error: {e}")
