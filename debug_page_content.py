
import pypdf

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    # Extract page 40 to 45
    for i in range(40, 46):
        print(f"\n--- Page {i} ---")
        print(reader.pages[i].extract_text())
except Exception as e:
    print(e)
