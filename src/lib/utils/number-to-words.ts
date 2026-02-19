
export function numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    if (num === 0) return 'Zero Only';

    const parts = num.toString().split('.');
    const rupees = parseInt(parts[0]);
    const paise = parts[1] ? parseInt(parts[1].substring(0, 2).padEnd(2, '0')) : 0;

    function convertGroup(n: number): string {
        if (n === 0) return '';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertGroup(n % 100) : '');
    }

    function formatRupees(n: number): string {
        if (n === 0) return '';
        let result = '';
        let scaleIndex = 0;

        // Handle Indian/Nepali numbering system (Thousands, Lakhs, Crores)
        // For simplicity, we'll use International scale first, then customize if requested.
        // But for Nepal, Lakhs/Crores is preferred. Let's do a basic International one first or Indian.

        let temp = n;
        let groups = [];

        // Basic International implementation for now
        while (temp > 0) {
            groups.push(temp % 1000);
            temp = Math.floor(temp / 1000);
        }

        for (let i = 0; i < groups.length; i++) {
            if (groups[i] !== 0) {
                result = convertGroup(groups[i]) + (scales[i] ? ' ' + scales[i] : '') + (result ? ' ' + result : '');
            }
        }

        return result.trim();
    }

    let output = '';
    const rupeeWords = formatRupees(rupees);
    if (rupeeWords) {
        output += rupeeWords + ' Rupees';
    }

    if (paise > 0) {
        if (output) output += ' and ';
        output += convertGroup(paise) + ' Paise';
    }

    return output + ' Only';
}
