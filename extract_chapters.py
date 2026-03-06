
import pypdf
import os

pdf_path = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\java-swing-2nbsped-9780596004088_compress.pdf"
output_dir = r"c:\Users\juliano.silva\OneDrive - Organização\Documentos\Senai\SIS\CursoDesenvolvimentoSistemas\CursoDesenvolvimentoSistemas\DesenvolvimentoDeSistemas\Java\raw_content"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

chapters = [
    (1, 1, 20),
    (2, 20, 41),
    (3, 41, 84),
    (4, 84, 101),
    (5, 101, 132),
    (6, 132, 159),
    (7, 159, 225),
    (8, 225, 259),
    (9, 259, 286),
    (10, 286, 314),
    (11, 314, 366),
    (12, 366, 406),
    (13, 406, 432),
    (14, 432, 489),
    (15, 489, 530) # Estimating end of Ch 15
]

# Offset due to front matter (usually PDF page 1 is not Book page 1)
# In the TOC extract, "Chapter 1" was on "Page 6" of the PDF (PDF page 5 index).
# The TOC says "1. Introducing Swing ... 1". So Book Page 1 is likely PDF Page X.
# Let's find where "Chapter 1" actually starts.
# I will dump a few pages around the expected start to calibrate.

try:
    reader = pypdf.PdfReader(pdf_path)
    
    # Heuristic: The TOC said Chapter 1 starts on page 1.
    # Usually Roman numerals (i, ii...) take up some pages.
    # Let's assume an offset. I'll search for "Chapter 1" in the first 30 pages.
    
    offset = 0
    for i in range(30):
        text = reader.pages[i].extract_text()
        if "Chapter 1" in text or "Introducing Swing" in text:
            # Check if it looks like the start of the chapter
            if "What Is Swing?" in text:
                print(f"Found Chapter 1 start at PDF page {i}")
                offset = i - 1 # Book page 1 is PDF page i
                break
    
    if offset == 0:
        print("Could not determine offset, using default 20")
        offset = 20

    for ch_num, start, end in chapters:
        text = ""
        # Adjust for offset
        pdf_start = start + offset
        pdf_end = end + offset
        
        for i in range(pdf_start, pdf_end):
            if i < len(reader.pages):
                text += reader.pages[i].extract_text() + "\n"
        
        with open(os.path.join(output_dir, f"chapter_{ch_num}.txt"), "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extracted Chapter {ch_num}")

except Exception as e:
    print(f"Error: {e}")
