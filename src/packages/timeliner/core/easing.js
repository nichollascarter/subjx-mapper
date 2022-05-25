class Easing {

    none = () => 0
    linearEaseNone = k => k
    quadraticEaseIn = k => k * k
    quadraticEaseOut = (k) => k * (k - 2)
    quadraticEaseInOut = (k) => {
        if ((k *= 2) < 1) return 0.5 * k * k;
        return - 0.5 * (--k * (k - 2) - 1);
    }
    cubicEaseIn = k => k * k * k
    cubicEaseOut = k => --k * k * k + 1
    cubicEaseInOut = (k) => {
        if ((k *= 2) < 1) return 0.5 * k * k * k;
        return 0.5 * ((k -= 2) * k * k + 2);
    }
    elasticEaseIn = (k) => {
        let s, a = 0.1, p = 0.4;
        if (k === 0) return 0; if (k == 1) return 1; if (!p) p = 0.3;
        if (!a || a < 1) { a = 1; s = p / 4; }
        else s = p / (2 * Math.PI) * Math.asin(1 / a);
        return - (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
    }
    elasticEaseOut = (k) => {
        let s, a = 0.1, p = 0.4;
        if (k === 0) return 0; if (k == 1) return 1; if (!p) p = 0.3;
        if (!a || a < 1) { a = 1; s = p / 4; }
        else s = p / (2 * Math.PI) * Math.asin(1 / a);
        return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
    }
    elasticEaseInOut = (k) => {
        let s, a = 0.1, p = 0.4;
        if (k === 0) return 0; if (k == 1) return 1; if (!p) p = 0.3;
        if (!a || a < 1) { a = 1; s = p / 4; }
        else s = p / (2 * Math.PI) * Math.asin(1 / a);
        if ((k *= 2) < 1) return - 0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
        return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
    }
    backEaseIn = (k) => {
        const s = 1.70158;
        return k * k * ((s + 1) * k - s);
    }
    backEaseOut = (k) => {
        const s = 1.70158;
        return (k = k - 1) * k * ((s + 1) * k + s) + 1;
    }
    backEaseInOut = (k) => {
        const s = 1.70158 * 1.525;
        if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
        return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
    }
    bounceEaseIn = (k) => 1 - this.bounceEaseOut(1 - k)
    bounceEaseOut = (k) => {
        if ((k /= 1) < (1 / 2.75)) {
            return 7.5625 * k * k;
        } else if (k < (2 / 2.75)) {
            return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
        } else if (k < (2.5 / 2.75)) {
            return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
        } else {
            return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
        }
    }
    bounceEaseInOut = (k) => {
        if (k < 0.5) return this.bounceEaseIn(k * 2) * 0.5;
        return this.bounceEaseOut(k * 2 - 1) * 0.5 + 0.5;
    }

}

export default new Easing();
