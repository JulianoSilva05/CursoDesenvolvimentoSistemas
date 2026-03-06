
import os
import pypdf

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"

# Estimated chapter titles for searching
chapter_titles = [
    "4. Labels and Icons",
    "5. Buttons",
    "6. Bounded-Range Components",
    "7. Lists, Combo Boxes, and Spinners",
    "8. Swing Containers",
    "9. Internal Frames",
    "10. Swing Dialogs",
    "11. Specialty Panes and Layout Managers",
    "12. Chooser Dialogs",
    "13. Borders",
    "14. Menus and Toolbars",
    "15. Tables"
]

try:
    reader = pypdf.PdfReader(pdf_path)
    num_pages = len(reader.pages)
    
    chapter_starts = {}
    current_search_idx = 0
    
    # We start searching from page 110 (where Ch 3 ended approx)
    start_search_page = 110
    
    print(f"Scanning for chapters starting from page {start_search_page}...")
    
    for i in range(start_search_page, min(start_search_page + 600, num_pages)):
        text = reader.pages[i].extract_text()
        lines = text.strip().split('\n')
        if not lines: continue
        
        # Look for "CHAPTER <N>"
        target_ch_num = current_search_idx + 4 # Starting from Ch 4
        
        # Heuristic: Check if "CHAPTER X" is in the first few lines
        header_text = "\n".join(lines[:5])
        
        if f"CHAPTER {target_ch_num}" in header_text.upper():
             print(f"Found Chapter {target_ch_num} at PDF page {i}")
             chapter_starts[target_ch_num] = i
             current_search_idx += 1
             if current_search_idx >= len(chapter_titles):
                 break
    
    print("Chapter starts found:", chapter_starts)
    
    # Save to file for next script to use
    with open("chapter_map.txt", "w") as f:
        for ch, page in chapter_starts.items():
            f.write(f"{ch}:{page}\n")

except Exception as e:
    print(f"Error: {e}")
