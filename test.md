{
    "text": "Created 'python' folder with 'sort_function.py' and 'addition_function.py'",
    "files": {
        "python": {
            "sort_function.py": {
                "file": {
                    "contents": "def bubble_sort(list_):
                        n = len(list_)
                        for i in range(n-1):
                            for j in range(n-i-1):
                                if list_[j] > list_[j+1]:
                                    list_[j], list_[j+1] = list_[j+1], list_[j]
                        return list_
                    def insertion_sort(list_):
                        for i in range(1, len(list_)):
                            key = list_[i]
                            j = i-1
                            while j >= 0 and key < list_[j] :
                                    list_[j+1] = list_[j]
                                    j -= 1
                            list_[j+1] = key
                        return list_
                    #Example
                    unsorted_list = [64, 34, 25, 12, 22, 11, 90]
                    print(\"Unsorted array:\", unsorted_list)
                    sorted_list_bubble = bubble_sort(unsorted_list.copy())
                    print(\"Sorted array using bubble sort:\", sorted_list_bubble)
                    sorted_list_insertion = insertion_sort(unsorted_list.copy())
                    print(\"Sorted array using insertion sort:\", sorted_list_insertion)
                    "
                }
            },
            "addition_function.py": {
                "file": {
                    "contents": "# Function to add two numbers
                    def add(x, y):
                        \"\"\"This function adds two numbers and returns the sum.
                        Args:
                            x: The first number.
                            y: The second number.
                        Returns:
                            The sum of x and y.
                        \"\"\"
                        return x + y
                    # Example usage
                    a = 10
                    b = 5
                    sum = add(a, b)
                    print(f'The sum of {a} and {b} is {sum}')
                    #Handling exceptions
                    try:
                        result = add(10, 'a')
                    except TypeError:
                        print(\"Error: Invalid input types. Please provide numbers only.\")
                    "
                }
            }
        }
    }
}