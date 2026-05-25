/**
 * Extracts hashtags from a given HTML content string.
 * It first strips HTML tags to avoid matching hex colors (e.g. #FFFFFF) as hashtags.
 * Then it finds all `#word` patterns, removes them from the original HTML string,
 * and returns the cleaned HTML string along with a unique list of hashtags.
 * 
 * @param {string} htmlContent - The original HTML string (from rich text editor)
 * @returns {Object} An object containing the cleaned HTML string and an array of hashtags
 */
export function extractAndCleanHashtags(htmlContent) {
    if (!htmlContent) return { finalText: '', hashtags: [] };

    // Extract text from HTML to avoid characters like '#' in hex colors
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    // Regex to find words starting with #
    const regex = /#(\w+)/g;
    const matches = plainText.match(regex) || [];
    
    let finalText = htmlContent;
    matches.forEach(hashtag => {
        // Create regex to replace the exact hashtag in the HTML
        const regHapus = new RegExp(hashtag, 'gi');
        finalText = finalText.replace(regHapus, '');
    });

    // Clean '#' character, convert to lowercase, and remove duplicates
    const hashtags = [...new Set(matches.map(tag => tag.replace('#', '').toLowerCase()))];

    return { finalText, hashtags };
}
