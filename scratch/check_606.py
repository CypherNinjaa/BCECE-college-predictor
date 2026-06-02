import csv

csv_path = r"d:\BCECE college predictor\REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv"

print("Checking rank 606 in CSV:")
with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        pcb_ur_rank = row['pcb_ur_rank'].strip()
        pcm_ur_rank = row['pcm_ur_rank'].strip()
        if "606" in pcb_ur_rank or "606" in pcm_ur_rank:
            print(row)
