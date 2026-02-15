export function toTitleCase(str: string, replace: boolean = false): string {
    if (replace) {
        str = str.replaceAll(/[-_]/g, " ")
    }
    return str.toLowerCase().split(' ').map((word: string) => {
        return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}