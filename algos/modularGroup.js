modularGroup = function (chelper, imgData) {
    var self = this;
    self.scale = chroma.scale('Spectral');
    self.s = new xform(_zero, _minusOne, _one, _zero);
    self.t = new xform(_one, _one, _zero, _one);
    self.minusT = new xform(_one, _minusOne, _zero, _one);
    self.nLevels = 10;
    var data = imgData.data;
    var oimgData = chelper.ctx.createImageData(imgData);
    self.odata = oimgData.data;
    self.count = 0;
    this.drawPoint = function ( z, i) {
        var col = self.scale(((self.count++) % self.nLevels) / self.nLevels).rgb();

        var index = chelper.complexNumberToPixel(z);
        chelper.drawPixel(self.odata, index, col[0], col[1], col[2],255);
    }
    this.nextGen = function(y, genNumber) {
        genNumber++;
        if (genNumber > 1) return;
        var z = self.s.doit(y);
        var z1 = self.minusT.doit(y);
        var z2 = self.t.doit(y);
        self.drawPoint(z, genNumber);
        self.drawPoint(z1, genNumber);
        self.drawPoint(z2, genNumber);
        self.nextGen(z,genNumber);
        self.nextGen(z1,genNumber);
        self.nextGen(z2,genNumber);
    }
    this.main = function (imgData) {

        chelper.xform = new xform(_one, _zero, _zero, _one);
        for (var i = 0; i < data.length; i += 4) {
            var complexNumber = chelper.pixelToComplexNumber(i / 4);
            var cxabssquared = complexNumber.x * complexNumber.x 
            + complexNumber.y * complexNumber.y;
            chelper.drawPixel(self.odata, i, 0,0,255,255);
            if (Math.abs(cxabssquared-1) < 0.05 && Math.abs(complexNumber.x-.5) < .05) {
                chelper.drawPixel(self.odata, i, 0,255,0,255);
            }
        }
        chelper.addReferencePoints2();
        for (var i = 0; i < data.length; i += 4) {
            self.count = 0;
            var complexNumber = chelper.pixelToComplexNumber(i / 4);

            if (complexNumber.y < 0) {
                chelper.drawPixel(self.odata, i, 255,0,255,0);
            }
            else {
                var cxabssquared = complexNumber.x * complexNumber.x 
                                    + complexNumber.y * complexNumber.y;
                if (Math.abs(cxabssquared) > 1 && Math.abs(complexNumber.x) < .5) {
                    var y = complexNumber;
                    self.drawPoint(y, 0);
                    var genNumber =0;
                    self.nextGen(y,genNumber);
                    var rightY = y;
                    var leftY = y;
                    for (var j = 0; j < 5; j++) {
                        var rightY = self.t.doit(rightY);
                        self.drawPoint(rightY, 0);
                        self.nextGen(rightY,genNumber);
                        var leftY = self.minusT.doit(leftY);
                        self.drawPoint(leftY, 0);
                        self.nextGen(leftY,genNumber);
                    }
                }
            }
        }
        chelper.drawCPoint(.25, 0, 'green');
        chelper.drawCPoint(-.25, 0.01, 'yellow');
        chelper.drawCPoint(.75, 0., 'yellow');
        chelper.drawCPoint(300, 0., 'yellow');
        chelper.ctx.putImageData(oimgData, 0, 0);
        chelper.drawReferencePoints();
    }
    this.main();
}
