
import pypdf
import re

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"

chapter_titles = [
    "1. Introducing Swing",
    "2. Jump-Starting a Swing Application",
    "3. Swing Component Basics",
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
    
    # We scan pages to find titles.
    # To be efficient, we can skip pages if we know the previous chapter was at page X.
    # But for robustness, let's scan the first 600 pages (should cover up to Ch 15).
    
    print("Scanning for chapter starts...")
    
    current_search_idx = 0
    
    for i in range(min(600, num_pages)):
        text = reader.pages[i].extract_text()
        
        # Check for the current chapter title
        title = chapter_titles[current_search_idx]
        
        # Simple check: Title should be in the text, and maybe "Chapter X" nearby
        # The book format seems to be "Chapter X" then "Title".
        # Or "X. Title".
        # The TOC used "1. Introducing Swing".
        # The page content I saw earlier had "CHAPTER 1\nIntroducing Swing".
        
        # Regex for "Chapter N"
        # We need to be careful not to match TOC entries.
        # Chapter title usually appears in large font or specific layout, but text extraction flattens it.
        # However, usually it's at the start of the page text.
        
        # Let's try to match "CHAPTER <N>"
        # The previous read of page 24 (which I thought was Ch 2) had "2 | Chapter 1: Introducing Swing" in the header!
        # This means the header contains the current chapter info.
        # So when the header changes to "Chapter 2", we know we are in Chapter 2.
        
        # Let's extract the header line (first line usually).
        lines = text.strip().split('\n')
        if not lines: continue
        
        # Look for "Chapter N" in the text, usually near top
        # Or look for the Title.
        
        # If we find "CHAPTER <N>" on a page, it's likely the start.
        if f"CHAPTER {current_search_idx + 1}" in text:
             # Verify it's not a reference
             # The start page usually has the title right after
             if i not in chapter_starts.values():
                 print(f"Found Chapter {current_search_idx + 1} at PDF page {i}")
                 chapter_starts[current_search_idx + 1] = i
                 current_search_idx += 1
                 if current_search_idx >= len(chapter_titles):
                     break
    
    print("Chapter starts found:", chapter_starts)
    
    # Now extract content
    import os
    output_dir = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\raw_content_v2"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for ch_num, start_page in chapter_starts.items():
        # End page is start of next chapter, or some arbitrary limit
        next_ch = ch_num + 1
        end_page = chapter_starts.get(next_ch, start_page + 30) # Default 30 pages if next not found
        
        text = ""
        for i in range(start_page, end_page):
            text += reader.pages[i].extract_text() + "\n"
            
        with open(os.path.join(output_dir, f"chapter_{ch_num}.txt"), "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extracted Chapter {ch_num} ({end_page - start_page} pages)")

except Exception as e:
    print(f"Error: {e}")
