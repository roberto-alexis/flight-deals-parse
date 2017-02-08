function Token(commentId, sentenceIndex, word) {
    this.commentId = commentId;
    this.sentenceIndex = sentenceIndex;
    this.word = word;
}

function CoOccurrence(word1, word2, count) {
    this.word1 = word1;
    this.word2 = word2;
    this.count = count;

    this.toString = function() {
        return '(' + word1 + ', ' + word2 + ', ' + count + ')';
    }
}

/**
 * Complete the function below.
 * @param n requested number of co-occurrences
 * @param tokens array of {@link Token} objects
 * @return an array of {@link CoOccurrence} objects
 */
function findFrequentCoOccurrences(n, tokens) {
    // Your code here
    return [new CoOccurrence('test', 'test2', 5), new CoOccurrence('test3', 'test4', 10)];
}

/**
 * The following code is not relevant for this exercise. It is only here to help
 * running the tests.
 */
main();

function main() {
    process.stdin.resume();
    process.stdin.setEncoding("ascii");
    var _stdin = "";
    process.stdin.on("data", function (input) {
        _stdin += input;
    });
    process.stdin.on("end", function () {
        var _stdin_array = _stdin.split("\n");
        var n = parseInt(_stdin_array[0].trim(), 10);
        var arraySize = parseInt(_stdin_array[1].trim(), 10);
        var tokens = [];
        for (i = 2; i < 2 + arraySize; i++) {
            var parts = _stdin_array[i].split(",");
            tokens.push(new Token(parseInt(parts[0], 10), parseInt(parts[1], 10), parts[2]));
        }

        var result = findFrequentCoOccurrences(n, tokens);
        var output = "";
        for (i = 0; i < result.length; i++) {
            if (i > 0) {
                output += ', ';
            }
            output += result[i].toString();
        }
        process.stdout.write("[" + output + "]");
    });
}