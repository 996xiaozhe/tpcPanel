import os
import argparse

# 常见代码文件扩展名列表，你可以根据需要添加或修改
DEFAULT_CODE_EXTENSIONS = [
    '.py', '.js', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.html', '.css',
    '.go', '.rb', '.php', '.swift', '.kt', '.ts', '.sh', '.bat', '.ps1',
    '.sql', '.r', '.pl', '.lua', '.scala', '.groovy', '.dart', '.rs',
    '.json', '.xml', '.yaml', '.yml', '.md', '.txt' # 有时也想包含这些
]

# 扩展名到 Markdown 代码块语言提示的映射
# 参考: https://help.github.com/en/github/writing-on-github/creating-and-highlighting-code-blocks
LANGUAGE_MAP = {
    '.py': 'python',
    '.js': 'javascript',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c', # 通常 .h 文件可以高亮为 C
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.html': 'html',
    '.css': 'css',
    '.go': 'go',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.ts': 'typescript',
    '.sh': 'shell', # 或者 bash
    '.bat': 'batch',
    '.ps1': 'powershell',
    '.sql': 'sql',
    '.r': 'r',
    '.pl': 'perl',
    '.lua': 'lua',
    '.scala': 'scala',
    '.groovy': 'groovy',
    '.dart': 'dart',
    '.rs': 'rust',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.txt': 'plaintext',
    # 根据需要添加更多
}

def find_and_write_code_files(search_dir, output_md_file, code_extensions):
    """
    递归搜索目录中的代码文件，并将它们写入 Markdown 文件。

    参数:
    search_dir (str): 要搜索的根目录。
    output_md_file (str): 输出的 Markdown 文件名。
    code_extensions (list): 要查找的代码文件扩展名列表。
    """
    if not os.path.isdir(search_dir):
        print(f"错误：目录 '{search_dir}' 不存在。")
        return

    # 将扩展名转换为小写并确保它们以点开头
    processed_extensions = [ext.lower() if ext.startswith('.') else '.' + ext.lower() for ext in code_extensions]

    print(f"正在搜索目录: {os.path.abspath(search_dir)}")
    print(f"查找的扩展名: {', '.join(processed_extensions)}")
    print(f"输出到文件: {os.path.abspath(output_md_file)}")

    found_files_count = 0
    with open(output_md_file, 'w', encoding='utf-8') as md_file:
        for root, _, files in os.walk(search_dir):
            for filename in files:
                file_ext = os.path.splitext(filename)[1].lower()
                if file_ext in processed_extensions:
                    found_files_count += 1
                    file_path = os.path.join(root, filename)
                    relative_path = os.path.relpath(file_path, search_dir) # 获取相对路径以保持简洁
                    print(f"  找到文件: {file_path}")

                    # 写入 Markdown 标题 (H1)
                    md_file.write(f"# {relative_path}\n\n") # 使用相对路径作为标题

                    # 获取代码块的语言提示
                    lang_hint = LANGUAGE_MAP.get(file_ext, '') # 如果没有映射，则为空字符串

                    # 写入代码块开始
                    md_file.write(f"```{lang_hint}\n")

                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as code_file:
                            content = code_file.read()
                            md_file.write(content)
                    except Exception as e:
                        md_file.write(f"无法读取文件内容: {e}\n")
                        print(f"    警告: 无法读取文件 '{file_path}': {e}")

                    # 写入代码块结束
                    md_file.write("\n```\n\n")
    
    if found_files_count > 0:
        print(f"\n处理完成！共找到并处理了 {found_files_count} 个代码文件。")
        print(f"结果已保存到: {os.path.abspath(output_md_file)}")
    else:
        print(f"\n在目录 '{search_dir}' 中没有找到指定扩展名的代码文件。")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="递归搜索指定目录下的代码文件，并将它们的内容输出到一个 Markdown 文件中。"
    )
    parser.add_argument(
        "search_directory",
        type=str,
        help="要搜索代码文件的根目录。"
    )
    parser.add_argument(
        "output_markdown_file",
        type=str,
        help="输出的 Markdown 文件名 (例如: 'codes.md')。"
    )
    parser.add_argument(
        "-e", "--extensions",
        nargs='+', # 接受一个或多个参数
        default=DEFAULT_CODE_EXTENSIONS,
        help=(
            "要查找的代码文件扩展名列表 (例如: .py .js .java)。"
            f"默认为: {', '.join(DEFAULT_CODE_EXTENSIONS)}"
        )
    )

    args = parser.parse_args()

    find_and_write_code_files(
        args.search_directory,
        args.output_markdown_file,
        args.extensions
    )