/**
 * A node that represents content (i.e.: "some content")
 */
function Content(content) {
    this.content = content;
}

/**
 * A node that represents an HTML tag (i.e.: "<body>...</body>")
 */
function Element(tag, id, children) {
    this.tag = tag;
    this.id = id;
    this.children = children;
}

/**
 * A DOM representation of the HTML document
 * @param root node to use as the root of the document tree
 */
function Dom(root) {
    this.root = root;
}

/**
 * Complete the function below. Create as many inner classes or auxiliary functions as needed.
 * @param dom the DOM representation of the HTML document (see Dom object)
 * @param whiteList an array of white listed strings
 * @returns the output that should be sent to the STDOUT
 */
function format(dom, whiteList) {
    // Your code here
    return JSON.stringify(dom);
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
        var html = _stdin_array[0];
        var whiteList = _stdin_array[1].split(",");
        if (whiteList.length === 1 && !whiteList[0]) {
            whiteList = [];
        }
        var dom = new Dom(new Parser(html).parse());

        var output = format(dom, whiteList);

        process.stdout.write(output);
    });
}

function Parser(html) {
    this.START_ELEMENT_PATTERN = /^<(.*?)>/;
    this.END_ELEMENT_PATTERN = /^<\/(.*?)>/;
    this.CLASS_PATTERN = /(.*) id='(.*)'/;
    this.CONTENT_PATTERN = /^(.*?)</

    this.Token = function(type, tag, id, content) {
        this.type = type;
        this.tag = tag;
        this.id = id;
        this.content = content;
    }

    this.tokenise = function (input) {
        var tokens = [];
        while(input) {
            var endElement = this.END_ELEMENT_PATTERN.exec(input);
            if (endElement) {
                tokens.push(new this.Token('END', endElement[1], null, null));
                input = input.substring(endElement[0].length);
            } else {
                var startElement = this.START_ELEMENT_PATTERN.exec(input);
                if (startElement) {
                    var classElement = this.CLASS_PATTERN.exec(startElement[1]);
                    if (classElement) {
                        tokens.push(new this.Token('START', classElement[1], classElement[2], null));
                    } else {
                        tokens.push(new this.Token('START', startElement[1], null, null));
                    }
                    input = input.substring(startElement[0].length);
                } else {
                    var content = this.CONTENT_PATTERN.exec(input);
                    if (content) {
                        tokens.push(new this.Token('CONTENT', null, null, content[1]));
                        input = input.substring(content[1].length);
                    } else {
                        tokens.push(new this.Token('CONTENT', null, null, input));
                        input = "";
                    }
                }
            }
        }
        console.log(JSON.stringify(tokens) + "\n");
        return tokens;
    }

    this.tokens = this.tokenise(html);
    this.position = 0;

    this.parse = function() {
        var token = this.tokens[this.position];
        var children = [];
        for(this.position++; this.position < this.tokens.length; this.position++) {
            var node = null;
            var currentToken = this.tokens[this.position];
            switch (currentToken.type) {
                case 'START':
                    node = this.parse();
                    break;
                case 'END':
                    node = null;
                    break;
                default:
                    node = new Content(currentToken.content);
                    break;
            }
            if (!node) {
                break;
            }
            children.push(node);
        }
        return new Element(token.tag, token.id, children);
    }


}
