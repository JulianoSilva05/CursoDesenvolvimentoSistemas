
import pypdf

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    print(f"Number of pages: {len(reader.pages)}")
    
    # Try to get outline
    try:
        outline = reader.outline
        if outline:
            print("Outline found:")
            for item in outline:
                if isinstance(item, list):
                    for subitem in item:
                        if hasattr(subitem, 'title'):
                             print(f"  - {subitem.title}")
                elif hasattr(item, 'title'):
                    print(f"- {item.title}")
        else:
            print("No outline found.")
    except Exception as e:
        print(f"Error reading outline: {e}")

    # Extract text from first 10 pages to see content style
    print("\n--- First 10 pages content sample ---")
    for i in range(min(10, len(reader.pages))):
        page = reader.pages[i]
        print(f"--- Page {i+1} ---")
        print(page.extract_text())
        
except Exception as e:
    print(f"Error: {e}")
