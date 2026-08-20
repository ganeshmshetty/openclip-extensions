function action(selection) {
    if (!selection) return "";
    return Array.from(selection).reverse().join("");
}
