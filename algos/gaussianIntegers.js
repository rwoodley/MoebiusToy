gaussianIntegers = function (chelper, imgData) {
    var data = imgData.data;

    var oimgData = chelper.ctx.createImageData(imgData);
    var odata = oimgData.data;
    chelper.xform = new xform(_one, _zero, _zero, _one);
    for (var i = 0; i < data.length; i += 4) {
        var index = i;
        odata[index] = 0;
        odata[index + 1] = 0;
        odata[index + 2] = 0;
        odata[index + 3] = 255;
    }
    chelper.addReferencePoints2();
    var scale = chroma.scale('Spectral');
    for (var i = 0; i < data.length; i += 4) {
        var red = data[i];
        var green = data[i + 1];
        var blue = data[i + 2];
        var alpha = data[i + 3];
        var complexNumber = chelper.pixelToComplexNumber(i/4);

        // real number line only.
        var cxabssquared = complexNumber.x * complexNumber.x + complexNumber.y * complexNumber.y;
        var epsilon = .1 * Math.sqrt(cxabssquared);  ///complexNumber.x;
        if (Math.abs(complexNumber.x) > epsilon) continue;
        var nI = 1;
        var nJ = 1;
        for (ni = 0; ni < nI; ni++) {
            for (nj = 0; nj < nJ; nj++) {
                var newA = new complex(ni - 2, nj - 2);
                // var newA = new complex(0.,(ni*nJ)+nj);
                chelper.xform.a = newA;
                chelper.xform.b = newA;
                chelper.xform.c = newA;
                // chelper.xform.d = newA;
                // var newNumber = complexNumber;
                var newNumber = chelper.xform.doit(complexNumber);
                var index = chelper.complexNumberToPixel(newNumber);

                var col = scale(((ni * nJ) + nj) / (nI * nJ)).rgb();

                odata[index] = col[0];
                odata[index + 1] = col[1];
                odata[index + 2] = col[2];
                odata[index + 3] = 255;
                chelper.addReferencePoints();
            }
        }
    }
    chelper.ctx.putImageData(oimgData, 0, 0);
    chelper.drawReferencePoints();
}
