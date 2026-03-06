
import pypdf
import os

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"
output_dir = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\raw_content_v3"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Revised ranges
chapters = [
    (2, 43, 70),
    (3, 70, 110)
]

try:
    reader = pypdf.PdfReader(pdf_path)
    
    for ch_num, start, end in chapters:
        text = ""
        for i in range(start, end):
            if i < len(reader.pages):
                text += reader.pages[i].extract_text() + "\n"
        
        with open(os.path.join(output_dir, f"chapter_{ch_num}.txt"), "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extracted Chapter {ch_num}")

except Exception as e:
    print(f"Error: {e}")
