import os
import numpy as np
from PIL import Image

def detect_grid(img_path):
    if not os.path.exists(img_path):
        return
    
    img = Image.open(img_path)
    width, height = img.size
    gray = img.convert('L')
    arr = np.array(gray)
    
    # Analyze row and column variances or averages
    # Light backgrounds usually have high pixel values (near 255).
    # Grid lines or gutters between cards will have different average values.
    # Let's compute average intensity along rows and columns.
    row_profile = np.mean(arr, axis=1)
    col_profile = np.mean(arr, axis=0)
    
    # Print profile values at every 10th pixel to see the pattern
    print(f"\n--- Analysis for {img_path} ({width}x{height}) ---")
    
    # We can detect where rows/cols have a drop in intensity (borders) or are empty (gutters).
    # Let's print out indices where we have sudden changes.
    # For instance, a gutter is a region where the row/col has high brightness (background).
    # A card is a region with drawings/text, so it has lower average brightness.
    
    # Let's find intervals where average brightness is high (gutters) vs low (cards).
    # Let's print the horizontal and vertical profile summaries.
    print("Row profile (every 20px):")
    row_summary = [f"{i}:{int(row_profile[i])}" for i in range(0, height, 20)]
    print(", ".join(row_summary[:30]))
    if len(row_summary) > 30:
        print(", ".join(row_summary[30:60]))
        
    print("Col profile (every 20px):")
    col_summary = [f"{i}:{int(col_profile[i])}" for i in range(0, width, 20)]
    print(", ".join(col_summary[:30]))
    if len(col_summary) > 30:
        print(", ".join(col_summary[30:60]))

if __name__ == "__main__":
    detect_grid("public/images/cat_kitesurf.png")
    detect_grid("public/images/cat_wingfoil.png")
    detect_grid("public/images/cat_neoprene.png")
    detect_grid("public/images/cat_accessoires.png")
    detect_grid("public/images/cat_autres.png")
