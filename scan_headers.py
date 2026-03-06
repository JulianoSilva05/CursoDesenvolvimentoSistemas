
import pypdf

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    print("Scanning first 100 pages headers...")
    for i in range(100):
        text = reader.pages[i].extract_text()
        lines = text.strip().split('\n')
        if lines:
            print(f"Page {i}: {lines[0][:50]}") # Print first 50 chars of first line
except Exception as e:
    print(e)
