import os
import numpy as np
from PIL import Image

def slice_screenshot(img_path, category_name):
    if not os.path.exists(img_path):
        print(f"File {img_path} not found")
        return
    
    img = Image.open(img_path)
    width, height = img.size
    
    # We want to find the bounding boxes of individual product cards.
    # Typically, cards on a webpage are white boxes with gray borders or shadows,
    # and they are separated by gray or white margins (gutters).
    # Let's write a robust grid detector that finds horizontal and vertical divisions.
    
    gray = img.convert('L')
    arr = np.array(gray)
    
    # Let's count how many dark pixels (e.g. text/drawings, intensity < 245)
    # are present along each row and column.
    row_activity = np.sum(arr < 245, axis=1)
    col_activity = np.sum(arr < 245, axis=0)
    
    # Active rows/cols are those that contain content (text, images, borders)
    # A card row has high activity. A gutter row has very low activity.
    # Let's find contiguous regions of high activity.
    
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

    # Let's search with dynamic thresholding to find rows and columns
    # We'll adjust thresholds based on image dimensions and content
    row_segs = find_segments(row_activity, min_size=100, threshold=width * 0.01)
    col_segs = find_segments(col_activity, min_size=100, threshold=height * 0.01)
    
    print(f"\n{category_name} ({img_path}): detected {len(row_segs)} rows and {len(col_segs)} columns")
    print(f"Row segments: {row_segs}")
    print(f"Col segments: {col_segs}")
    
    # Let's create an output folder
    os.makedirs(f"public/images/products", exist_ok=True)
    
    # Crop and save each cell
    idx = 1
    for r_idx, (r_start, r_end) in enumerate(row_segs):
        for c_idx, (c_start, c_end) in enumerate(col_segs):
            # Crop the cell
            cell = img.crop((c_start, r_start, c_end, r_end))
            
            # Inside the card, the thumbnail image is typically located on the left or top.
            # Let's save the full cell crop first so we can see it, or crop the image part.
            # In many shop views, the image takes up the top half or the left-hand side.
            # Let's check the size of the cell:
            cell_w = c_end - c_start
            cell_h = r_end - r_start
            
            # Let's save both the full card and a thumbnail candidate.
            cell.save(f"public/images/products/{category_name.lower()}_row{r_idx+1}_col{c_idx+1}.png")
            print(f"  Saved card {idx} at row {r_idx+1}, col {c_idx+1}: {cell_w}x{cell_h}")
            idx += 1

if __name__ == "__main__":
    slice_screenshot("public/images/cat_kitesurf.png", "kitesurf")
    slice_screenshot("public/images/cat_wingfoil.png", "wingfoil")
    slice_screenshot("public/images/cat_neoprene.png", "neoprene")
    slice_screenshot("public/images/cat_accessoires.png", "accessoires")
    slice_screenshot("public/images/cat_autres.png", "autres")
