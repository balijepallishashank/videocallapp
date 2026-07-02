# src/main.py

class Section:
    def __init__(self, name, content):
        self.name = name
        self.content = content

    def display(self):
        print(f"Section: {self.name}")
        print(f"Content: {self.content}")


def add_section():
    name = input("Enter section name: ")
    content = input("Enter section content: ")
    return Section(name, content)


def main():
    section = add_section()
    section.display()

if __name__ == "__main__":
    main()