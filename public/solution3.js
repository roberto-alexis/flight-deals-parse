/**
 * Iterator of items.
 * @param items list of items to iterate on
 */
function Iterator(items) {
    this._items = items;
    this._position = 0;
    this.hasNext = function() {
        return this._position < this._items.length;
    }
    this.next = function() {
        var res = this._items[this._position];
        this._position++;
        return res;
    }
}

/*
 * Complete the function below. Create as many auxiliary functions as needed.
 * @param iters An {@link Iterator} of {@link Iterator}s of strings. This means that the items of the iterator
 * provided will be iterators themselves, which would return strings as elements.
 * @param target the string to look for
 * @param maxCount the maximum number of occurrences to look for
 */
function numberOfOccurrence(iters, target, maxCount) {
    process.stdout.write(target + "\n");
    process.stdout.write("" + maxCount + "\n");
    // Your code here
    var out = "";
    var i = 0;
    while(iters.hasNext()) {
        var subiter = iters.next();
        if (!subiter) {
            out += "null, ";
        } else {
            out += "[";
            while(subiter.hasNext()) {
                var item = subiter.next();
                if (!item) {
                    out += "null"
                } else {
                    out += "'" + item + "', ";
                }
                i++;
                if (i > maxCount) {
                    return out + " TRUNCATED to " + maxCount;
                }
            }
            out += "], ";
        }
    }
    return out;
}

/**
 * The following code is not relevant to the resolution of the exercise and it is only included
 * to produce the test cases.
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
        var _args = _stdin_array[0];
        var target = _stdin_array[1];
        var maxCount = parseInt(_stdin_array[2], 10);
        var iters = generateIterators(_args.split(" "));

        var output = numberOfOccurrence(iters, target, maxCount);

        process.stdout.write(output);
    });
}

if (typeof String.prototype.startsWith != 'function') {
    // see below for better implementation!
    String.prototype.startsWith = function (str){
        return this.indexOf(str) === 0;
    };
}

// crazy hack to generate the iterators
function generateIterators(args) {
    var topLvlList = [];
    var stringLists = args[1].split("#");
    if (args[0] == "list") {
        for (index in stringLists) {
            var split = stringLists[index].split("%");
            if (split.length == 1 && !split[0]) {
                split = [];
            }
            topLvlList.push(new Iterator(split));
        }
    } else if (args[0] == "function") {
        for (index in stringLists) {
            var func = stringLists[index];
            if (func.startsWith("increasing")) {
                var numbers = func.substring("increasing".length).split("to");
                var _min = parseInt(numbers[0]);
                var _max = parseInt(numbers[1]);
                topLvlList.push({
                    min: _min,
                    max: _max,
                    hasNext: function() {
                        return this.min < this.max;
                    },
                    next: function() {
                        return "" + this.min++;
                    }
                });
            } else if (func.startsWith("loop")) {
                var numbers = func.substring("loop".length).split("to");
                topLvlList.push({
                    x: parseInt(numbers[0]),
                    min: parseInt(numbers[0]),
                    max: parseInt(numbers[1]),
                    count: 0,
                    hasNext: function() {
                        return this.count + 1 < 1000000;
                    },
                    next: function() {
                        this.count++;
                        var output = "" + x;
                        x++;
                        if (x >= max) {
                            x = min;
                        }
                        return output;
                    }
                });
            } else if (func.startsWith("random")) {
                var _seed = parseInt(func.substring("random".length));
                topLvlList.push({
                    seed: _seed,
                    fakePrime: _seed + 1,
                    count: 0,
                    hasNext: function() {
                        return this.count + 1 < 1000000;
                    },
                    next: function() {
                        this.count++;
                        this.fakePrime++;
                        return "" + ((this.seed * this.fakePrime) % 100);
                    }
                });
            } else if (func.startsWith("null")) {
                topLvlList.push(null);
            } else if (func.startsWith("empty")) {
                topLvlList.push({
                    hasNext: function() {
                        return false;
                    },
                    next: function() {
                        return null;
                    }
                });
            }
        }
    }
    return new Iterator(topLvlList);
}