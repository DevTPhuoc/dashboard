import os

def print_directory_tree(root_dir, indent=""):
	exclude_dirs = {"__pycache__", "venv", ".venv", "env", ".env"}
	lines = []
	for item in os.listdir(root_dir):
		path = os.path.join(root_dir, item)
		if os.path.isdir(path):
			if item in exclude_dirs:
				continue
			lines.append(f"{indent}📁 {item}/")
			lines.extend(print_directory_tree(path, indent + "    "))
		else:
			lines.append(f"{indent}📄 {item}")
	return lines

if __name__ == "__main__":
	current_dir = os.path.dirname(os.path.abspath(__file__))
	output_file = os.path.join(current_dir, "project_structure.txt")
	lines = [f"Cấu trúc dự án tại: {current_dir}"]
	lines.extend(print_directory_tree(current_dir))
	with open(output_file, "w", encoding="utf-8") as f:
		for line in lines:
			f.write(line + "\n")
	print(f"Đã ghi cấu trúc dự án ra file: {output_file}")
