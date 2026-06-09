import os

files_to_check = ['crop_model.pkl', 'disease_model.pkl']

for file_name in files_to_check:
    if os.path.exists(file_name):
        with open(file_name, 'rb') as f:
            # Read the first 10 bytes
            header = f.read(10)
            print(f"File: {file_name} | Header (first 10 bytes): {header}")
    else:
        print(f"File: {file_name} not found.")