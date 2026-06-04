import os
import numpy as np
from PIL import Image

# Define screenshots and their corresponding product sequences
# The sequence is left-to-right, top-to-bottom in the screenshots.
MAPPING = {
    "public/images/cat_kitesurf.png": [
        "LOK-BOARDBAG-OPT",
        "LOK-PACK-KITE",
        "LOK-AILE-BARRE",
        "LOK-PACK-2AILES-BARRE",
        "LOK-BOARD-TWINTIP",
        "LOK-WING-AILE",
        "LOK-HARNAIS-CULOTTE",
        "LOK-AILE-SANSBARRE"
    ],
    "public/images/cat_wingfoil.png": [
        "LOK-NEOPRENE-COMBINAISON",
        "LOK-PACK-WING-GONFLABLE",
        "LOK-NEOPRENE-CAGOULE",
        "LOK-PACK-WING-RIGIDE",
        "LOK-PACK-WING-DEBUTANT",
        "LOK-WING-FOIL",
        "LOK-WING-BOARD",
        "LOK-WING-2AILE",
        "LOK-CAGOULE-OPT",
        "LOK-CHAUSSONS-OPT",
        "LOK-GANTS-OPT",
        "LOK-HARNAIS-CEINTURE"
    ],
    "public/images/cat_neoprene.png": [
        "LOK-NEOPRENE-VESTE",
        "LOK-NEOPRENE-CHAUSSONS",
        "LOK-COMBINAISON-OPT",
        "LOK-BOARDBAG",
        "LOK-NEOPRENE-GANTS",
        "LOK-HARNAIS-CEINTURE-OPT",
        "LOK-PROT-CASQUE",
        "LOK-VESTENEOPRENE-OPT",
        "LOK-PROT-GILET",
        "LOK-CASQUE-OPT",
        "LOK-GILET-OPT",
        "LOK-HARNAIS-CULOTTE-OPT"
    ],
    "public/images/cat_accessoires.png": [
        "LOK-3AILE-SANSBARRE",
        "LOK-AILE-BARRE-DUPLICATE", # Same as LOK-AILE-BARRE but we map it here
        "LOK-PACK-WING-GONFLABLE-DUPLICATE", # Same as LOK-PACK-WING-GONFLABLE
        "LOK-2AILE-SANSBARRE-CS",
        "LOK-3AILE-SANSBARRE-CS",
        "LOK-TWINTIP-OPT-CS",
        "LOK-2WING-AILE-CS",
        "LOK-INITIATION-FOIL-TRACTE",
        "LOK-BARRE",
        "LOK-KITEFOIL",
        "LOK-STRAPLESS",
        "LOK-TWINTIP-OPT"
    ],
    "public/images/cat_autres.png": [
        "LOK-BOARD-FOIL-WING",
        "LOK-PADDLE",
        "LOK-SURF"
    ]
}

def crop_and_map():
    os.makedirs("public/images/products", exist_ok=True)
    html_preview = []
    
    html_preview.append("""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Product Images Preview</title>
    <style>
        body { font-family: -apple-system, sans-serif; background: #f3f4f6; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .img-container { width: 180px; height: 180px; overflow: hidden; border-radius: 6px; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; background: #fafafa; }
        .img-container img { width: 100%; height: 100%; object-fit: cover; }
        h4 { margin: 10px 0 5px 0; font-size: 14px; }
        p { margin: 0; font-size: 12px; color: #6b7280; font-family: monospace; }
        .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #fef3c7; color: #d97706; margin-top: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Preview Mapped Product Images</h1>
    <div class="grid">
""")

    for img_path, refs in MAPPING.items():
        if not os.path.exists(img_path):
            print(f"File {img_path} not found, skipping...")
            continue
            
        img = Image.open(img_path)
        width, height = img.size
        gray = img.convert('L')
        arr = np.array(gray)
        
        row_activity = np.sum(arr < 245, axis=1)
        col_activity = np.sum(arr < 245, axis=0)
        
        def find_segments(activity, min_size=50, threshold=10):
            segments = []
            in_segment = False
            start = 0
            for i, val in enumerate(activity):
                if val > threshold and not in_segment:
                    start = i
                    in_segment = True
                elif val <= threshold and in_segment:
                    if i - start >= min_size:
                        segments.append((start, i))
                    in_segment = False
            if in_segment and len(activity) - start >= min_size:
                segments.append((start, len(activity)))
            return segments

        row_segs = find_segments(row_activity, min_size=100, threshold=width * 0.01)
        col_segs = find_segments(col_activity, min_size=100, threshold=height * 0.01)
        
        idx = 0
        for r_idx, (r_start, r_end) in enumerate(row_segs):
            for c_idx, (c_start, c_end) in enumerate(col_segs):
                if idx >= len(refs):
                    break
                ref = refs[idx]
                
                # Crop the product card
                card_img = img.crop((c_start, r_start, c_end, r_end))
                
                # Crop the thumbnail image portion:
                card_w, card_h = card_img.size
                
                # First, isolate the top part of the card where the image lives (e.g., top 65%)
                top_region = card_img.crop((5, 5, card_w - 5, int(card_h * 0.65)))
                
                # Find the bounding box of the non-white pixels within this top region
                top_gray = top_region.convert('L')
                top_arr = np.array(top_gray)
                
                # Threshold: consider anything darker than 245 as "content"
                content_mask = top_arr < 245
                
                content_rows = np.any(content_mask, axis=1)
                content_cols = np.any(content_mask, axis=0)
                
                if np.any(content_rows) and np.any(content_cols):
                    min_r, max_r = np.where(content_rows)[0][[0, -1]]
                    min_c, max_c = np.where(content_cols)[0][[0, -1]]
                    
                    # Add a small padding (e.g. 5px) around the tight bounding box
                    pad = 5
                    min_r = max(0, min_r - pad)
                    max_r = min(top_region.size[1], max_r + pad)
                    min_c = max(0, min_c - pad)
                    max_c = min(top_region.size[0], max_c + pad)
                    
                    thumb_img = top_region.crop((min_c, min_r, max_c, max_r))
                else:
                    thumb_img = top_region
                
                # If it's a duplicate, we can save it to the main ref as well
                ref_clean = ref.replace("-DUPLICATE", "")
                
                # Save thumbnail crop
                save_name = f"public/images/products/{ref_clean}.png"
                thumb_img.save(save_name)
                
                print(f"Mapped {ref_clean} -> {save_name} (from row {r_idx+1}, col {c_idx+1})")
                
                html_preview.append(f"""
                <div class="card">
                    <div class="img-container">
                        <img src="/images/products/{ref_clean}.png" alt="{ref_clean}">
                    </div>
                    <h4>{ref_clean}</h4>
                    <p>{img_path.split('/')[-1]} R{r_idx+1}C{c_idx+1}</p>
                </div>
                """)
                idx += 1
                
    html_preview.append("""
    </div>
</body>
</html>
""")
    with open("public/preview.html", "w") as f:
        f.write("".join(html_preview))
    print("\nPreview HTML generated at public/preview.html")

if __name__ == "__main__":
    crop_and_map()
