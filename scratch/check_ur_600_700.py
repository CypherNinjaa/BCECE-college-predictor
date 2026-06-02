import csv

csv_path = r"d:\BCECE college predictor\REVISED_PCMB-Joint_1st_Round_Allotment_16082025.xlsx.csv"

print("Checking all UR category candidates with ranks 600 to 700:")
with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        pcb_ur_rank = row['pcb_ur_rank'].strip()
        pcm_ur_rank = row['pcm_ur_rank'].strip()
        
        # Check PCB rank
        if pcb_ur_rank:
            try:
                rank_num = int(pcb_ur_rank.split('-')[1].strip())
                if 600 <= rank_num <= 700:
                    is_ews = row['pcm_cat_rank'].strip() != "" or row['pcb_cat_rank'].strip() != "" # wait, EWS rank is usually in pcb_cat_rank or pcb_smq etc. Let's see
                    print(f"PCB Rank: {rank_num}, Name: {row['name']}, Cat: {row['category']}, PCB_Cat: {row['pcb_cat_rank']}, Inst: {row['institute']}, Branch: {row['branch']}, Allotted_Cat: {row['allotted_cat']}, Seat_Type: {row['seat_type']}")
            except Exception as e:
                pass
                
        # Check PCM rank
        if pcm_ur_rank:
            try:
                rank_num = int(pcm_ur_rank.split('-')[1].strip())
                if 600 <= rank_num <= 700:
                    print(f"PCM Rank: {rank_num}, Name: {row['name']}, Cat: {row['category']}, PCM_Cat: {row['pcm_cat_rank']}, Inst: {row['institute']}, Branch: {row['branch']}, Allotted_Cat: {row['allotted_cat']}, Seat_Type: {row['seat_type']}")
            except Exception as e:
                pass
