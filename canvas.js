initCanvasTextureStuff = function() {
    var self = this;
    this.go = function(algo, onReadyCB) {
        // this kicks everything off.
        var that = this;
        _canvasWidth = canvas.width;
        _canvasHeight = canvas.height;
        self.generator = new generator(algo, onReadyCB);
    };
    this.getCanvas = function() {
        return self.generator.canvas;
    }
};
generator = function(algo, onReadyCB) {
    var PI = Math.PI;
    var self = this;
    this.algo = algo;
    this.onReadyCB = onReadyCB;
    this.canvas = document.getElementById('canvas');
    this.ctx = canvas.getContext('2d');
    this.cartesianToPolar = function(x,y,z) {
        var theta;
        var phi;
        phi = Math.atan2(y, x);
        //phi -= (PI/2.0);    // this correction lines up the UV texture nicely.
        if (phi <= 0.0) {
            phi = phi + PI*2.0; 
        }
        if (phi >= (2.0 * PI)) {    // allow 2PI since we gen uv over [0,1]
            phi = phi - 2.0 * PI;
        }
        // phi = 2. * PI - phi;        // flip the texture around.
        theta = Math.acos(z);
        return [phi, theta];
    }
    this.uvToComplex = function(u,v) {
        var theta;
        var phi;
        var x;
        var y;
        var z;
        // uv.x = clamp(uv.x,0.001,.999);
    
        // convert from uv to polar coords
        theta = (1.0-v) * PI;
        phi = PI * 2.0 * u+PI;
    
        // convert polar to cartesian. Theta is polar, phi is azimuth.
        x = Math.sin(theta)*Math.cos(phi);
        y = Math.sin(theta)*Math.sin(phi);
        z = Math.cos(theta);
    
        // x,y,z are on the unit sphere.
        // if we pretend that sphere is a riemann sphere, then we
        // can get the corresponding complex point, a.
        // http://math.stackexchange.com/questions/1219406/how-do-i-convert-a-complex-number-to-a-point-on-the-riemann-sphere
    
        // we added the PI to phi above to make the Y axis correspond with
        // the positive imaginary axis and the X axis correspond with
        //  the positive real axis. So flip y and x around in this next equation.
        return new complex(x/(1.0-z), y/(1.0-z));
    }
    this.complexToUV = function(inx,iny) {
        // now c back to sphere.
        var theta;
        var phi;
        var x;
        var y;
        var z;
        var denom = 1.0 + inx * inx + iny * iny;
        x = 2.0 * inx/denom;
        y = 2.0 * iny/denom;
        z = (inx*inx + iny*iny - 1.0)/denom;
        // console.log(x,y,z);

        // convert to polar
        var polarCoords = self.cartesianToPolar(x,y,z);
        phi = polarCoords[0];
        theta = polarCoords[1];
        // console.log(phi, theta);

        // now get uv in new chart.
        var newv = 1-theta/PI;
        var newu = (phi-PI)/(2.0 * PI);
        if (newu < 0.) newu = newu + 1.0;
        return [newu, newv];
    }
    this.drawGrid = function() {
        for (i = 0; i < self.canvasHeight; i+=10) {
        self.ctx.beginPath();
        self.ctx.moveTo(0, i);
        self.ctx.lineTo(_canvasWidth,i);
        self.ctx.stroke();
        // console.log(i);
        }
    }
    self.points = [];
    self.pointColors = [];
    this.drawCPoint = function(x,y, color) {
        var xpt = self.xform.doit(new complex(x,y));
        var pt = self.uvToCanvas( self.complexToUV(xpt.x,xpt.y));
        self.points.push(pt);
        self.pointColors.push(color);
    }
    this.uvToCanvas = function(pt) {
        // for canvas (0,0) is on upper left
        // for texture uv (0,0) is lower left
        return [
            Math.round(pt[0]*_canvasWidth), 
            Math.round((1-pt[1])*_canvasHeight)
            ];
    }
    this.drawPixel = function(odata, index, r,g,b,a) {
        odata[index] = r;
        odata[index + 1] = g;
        odata[index + 2] = b;
        odata[index + 3] = a;

    }
    this.addReferencePoints2 = function () {
        self.drawCPoint(0, 1, 'blue');
        self.drawCPoint(1, 0, 'purple');
        self.drawCPoint(0, -1, 'lightblue');
        self.drawCPoint(-1, 0, 'magenta');
    }
    this.addReferencePoints = function () {
        self.drawCPoint(0, 1, 'black');
        self.drawCPoint(1, 0, 'red');
        self.drawCPoint(0, -1, 'grey');
        self.drawCPoint(-1, 0, 'pink');
    }
    this.drawReferencePoints = function() {
        for (var i = 0; i < self.points.length; i++) {
            self.ctx.beginPath();
            // console.log(pt[0],pt[1]);
            self.ctx.arc(
                self.points[i][0],
                self.points[i][1],
                10, 2 * Math.PI, false);
            self.ctx.fillStyle = self.pointColors[i];
            self.ctx.fill();
        }            
    }
    this.pixelToComplexNumber = function(pixel) {
        var row = Math.floor(pixel / canvas.width);
        var col = pixel % canvas.width;
        var u = self.clamp(col / canvas.width);
        var v = self.clamp(1.0 - row / canvas.height);
        var complexNumber = self.uvToComplex(u, v);   
        return complexNumber;     
    }
    this.complexNumberToPixel = function(newNumber) {
        var uvPixels = self.uvToCanvas(self.complexToUV(newNumber.x, newNumber.y));
        var index = 4 * (uvPixels[0] + uvPixels[1] * canvas.width);
        return index;        
    }
    var img = new Image;
    self.clamp = function(x) {
        if (x < 0.0001) x = 0.0001;
        if (x > 0.9999) x = 0.9999;
        return x;
    }
    img.onload = function() {
        var tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = self.canvas.width;
        tmpCanvas.height = self.canvas.height;
        var tmpCtx = tmpCanvas.getContext('2d');
    
        tmpCtx.drawImage(img, 0, 0, img.width, img.height,
            0, 0, self.canvas.width, self.canvas.height);
    
        var imgData = tmpCtx.getImageData(0, 0, self.canvas.width, self.canvas.height);
        self.algo(self, imgData);
        console.log("done drawing");
        self.onReadyCB();
    }
    img.src = '../media/C.png';
    // self.ctx.fillRect(25, 25, 100, 100);
}
