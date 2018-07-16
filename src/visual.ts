module powerbi.extensibility.visual {

  export function getValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
    if (objects) {
      let object = objects[objectName];
      if (object) {
        let property: T = <T>object[propertyName];
        console.log(property+":"+propertyName);
        if (property !== undefined) {
          return property;
        }
      }
    }

    return defaultValue;
  }

  export function getCategoricalObjectValue<T>(category: DataViewCategoryColumn, index: number, objectName: string, propertyName: string, defaultValue: T): T {
    let categoryObjects = category.objects;

    if (categoryObjects) {
      let categoryObject: DataViewObject = categoryObjects[index];
      if (categoryObject) {
        let object = categoryObject[objectName];
        if (object) {
          let property: T = <T>object[propertyName];
          if (property !== undefined) {
            return property;
          }
        }
      }
    }
    return defaultValue;
  }

  export function drawMain<T>(drawing_elem:any, percent:number, forecolor:string, bgcolor:string, fontSize:number, fontWeight:string, fontColor:string, outerLineWidth:number, innerLineWidth:number, amendmentSize:number) {

        var context = drawing_elem.getContext("2d");

        var center_x = drawing_elem.width / 2;
        var center_y = drawing_elem.height / 2;
        var rad = Math.PI*2/100;


        function backgroundCircle(){
            context.save();
            context.beginPath();
            context.lineWidth = innerLineWidth;
            var radius = center_x - context.lineWidth-10;
            context.lineCap = "round";
            context.strokeStyle = bgcolor;
            context.fillStyle = "transparent";
            context.arc(center_x, center_y, radius, 0, Math.PI*2, false);
            context.fill();
            context.stroke();
            context.closePath();
            context.restore();
        }


        function foregroundCircle(n){
            context.save();
            context.strokeStyle = forecolor;
            context.lineWidth = outerLineWidth;
            context.lineCap = "round";
            var radius = center_x - context.lineWidth+amendmentSize-10;
            context.beginPath();
            context.arc(center_x, center_y, radius , -1*Math.PI/2, -1*Math.PI/2 +n*rad, false); //用于绘制圆弧context.arc(x坐标，y坐标，半径，起始角度，终止角度，顺时针/逆时针)
            context.stroke();
            context.closePath();
            context.restore();
        }

        function text(n){
            context.save();
            context.fillStyle = fontColor;
            var font_size = fontSize;
            context.font = fontWeight + " " + font_size + "px helvetica,arial,sans-serif";
            var text_width = context.measureText(n.toFixed(2)+"%").width;
            context.fillText(n.toFixed(2)+"%", center_x-text_width/2, center_y + font_size/2);
            context.restore();
        }

          backgroundCircle();
          text(percent);
          foregroundCircle(percent);
    }
  export class payPalKPIDonutChart implements IVisual {

    private rootElement: JQuery;

    private dataView: DataView;

    constructor(options: VisualConstructorOptions) {
      this.rootElement = $(options.element);
    }
    public update(options: VisualUpdateOptions) {

      this.dataView = options.dataViews[0];

      this.rootElement.empty();

      if (this.dataView != null) {
        var defaultFontColor: Fill = { "solid": { "color": "#000000" } };
        var defaultBackgroundColor: Fill = { "solid": { "color": "#ffffff" } };
        var defaultLowColor: Fill = { "solid": { "color": "#2CAA2A" } };
        var defaultMediumColor: Fill = { "solid": { "color": "#F2C811" } };
        var defaultHighColor: Fill = { "solid": { "color": "#E10000" } };
        var defaultInnerColor: Fill = { "solid": { "color": "#cccccc" } };
        var propertyGroups: DataViewObjects = this.dataView.metadata.objects;
        var propertyGroupName: string = "circleProperties";
        var enableCustomFontSizes: boolean = getValue<boolean>(propertyGroups, propertyGroupName, "enableCustomFontSizes", false);
        var fontBold: string = getValue<boolean>(propertyGroups, propertyGroupName, "fontBold", true) ? "bold": "normal";
        var fontColor: string = getValue<Fill>(propertyGroups, propertyGroupName, "fontColor", defaultFontColor).solid.color;
        var backgroundColor: string = getValue<Fill>(propertyGroups, propertyGroupName, "backgroundColor", defaultBackgroundColor).solid.color;
        var fontSize = getValue<number>(propertyGroups, propertyGroupName, "fontSize", 18);
        var minThreshold = getValue<number>(propertyGroups, propertyGroupName, "minThreshold", 50);
        var maxThreshold = getValue<number>(propertyGroups, propertyGroupName, "maxThreshold", 90);

        var lowColor = getValue<Fill>(propertyGroups, propertyGroupName, "lowColor", defaultLowColor).solid.color;
        var mediumColor = getValue<Fill>(propertyGroups, propertyGroupName, "mediumColor", defaultMediumColor).solid.color;
        var highColor = getValue<Fill>(propertyGroups, propertyGroupName, "highColor", defaultHighColor).solid.color;
        var innerColor = getValue<Fill>(propertyGroups, propertyGroupName, "innerColor", defaultInnerColor).solid.color;
        var outerLineWidth = getValue<number>(propertyGroups, propertyGroupName, "outerLineWidth", 8);
        var innerLineWidth = getValue<number>(propertyGroups, propertyGroupName, "innerLineWidth", 4);
        var amendmentSize = getValue<number>(propertyGroups, propertyGroupName, "amendmentSize", 4);

        var value: number = <number>this.dataView.single.value;

        var minLength: number = Math.min(options.viewport.width,options.viewport.height);
        var minFontSize: number = enableCustomFontSizes ? fontSize : Math.round(minLength/10)*2;

        var percent: number = value*100;

        var showColor: string = "#2CAA2A";

        if(maxThreshold<minThreshold){
            this.rootElement.append($("<div>")
                .text("Error,'maxThreshold' must be greater than 'minThreshold'.")
                .css({
                    "display": "table-cell",
                    "text-align": "center",
                    "vertical-align": "middle",
                    "text-wrap": "none",
                    "width": options.viewport.width,
                    "height": options.viewport.height,
                    "color": "red"
                }));
            return
        }
        if(percent>=maxThreshold){
            showColor = highColor
        }else if(percent>minThreshold&&percent<maxThreshold){
            showColor = mediumColor
        }else{
            showColor = lowColor
        }

        var outerDiv: JQuery = $("<div class='time-graph'></div>").css({"backgroundColor":backgroundColor});

        $(`<canvas id="time-graph-canvas" width="${2*minLength}"  height="${2*minLength}"></canvas>`).css(
            {
                "width": minLength,
                "height": minLength,
            }
        ).appendTo(outerDiv);

        this.rootElement.append(outerDiv);

        var time_canvas: JQuery = $("#time-graph-canvas");

        drawMain(time_canvas[0], percent, showColor, innerColor, minFontSize, fontBold, fontColor, outerLineWidth, innerLineWidth, amendmentSize);

      }else {
        this.rootElement.append($("<div>")
          .text("Please add a measure")
          .css({
            "display": "table-cell",
            "text-align": "center",
            "vertical-align": "middle",
            "text-wrap": "none",
            "width": options.viewport.width,
            "height": options.viewport.height,
            "color": "red"
          }));
      }
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {


      let objectName: string = options.objectName;
      let objectEnumeration: VisualObjectInstance[] = [];

      switch (objectName) {
        case 'circleProperties':

          objectEnumeration.push({
            objectName: objectName,
            displayName: objectName,
            properties: {
              enableCustomFontSizes: getValue<boolean>(this.dataView.metadata.objects, objectName, "enableCustomFontSizes", false),
              fontBold: getValue<boolean>(this.dataView.metadata.objects, objectName, "fontBold", true),
              fontSize: getValue<number>(this.dataView.metadata.objects, objectName, "fontSize", 18),
              fontColor: getValue<Fill>(this.dataView.metadata.objects, objectName, "fontColor", { "solid": { "color": "#000000" } }),
              backgroundColor: getValue<Fill>(this.dataView.metadata.objects, objectName, "backgroundColor", { "solid": { "color": "#ffffff" } }),
              minThreshold: getValue<number>(this.dataView.metadata.objects, objectName, "minThreshold", 50),
              maxThreshold: getValue<number>(this.dataView.metadata.objects, objectName, "maxThreshold", 90),
              lowColor: getValue<Fill>(this.dataView.metadata.objects, objectName, "lowColor", { "solid": { "color": "#2CAA2A" } }),
              mediumColor: getValue<Fill>(this.dataView.metadata.objects, objectName, "mediumColor", { "solid": { "color": "#F2C811" } }),
              highColor: getValue<Fill>(this.dataView.metadata.objects, objectName, "highColor", { "solid": { "color": "#E10000" } }),
              innerColor: getValue<Fill>(this.dataView.metadata.objects, objectName, "innerColor", { "solid": { "color": "#cccccc" } }),
              outerLineWidth: getValue<number>(this.dataView.metadata.objects, objectName, "outerLineWidth", 8),
              innerLineWidth: getValue<number>(this.dataView.metadata.objects, objectName, "innerLineWidth", 4),
              amendmentSize: getValue<number>(this.dataView.metadata.objects, objectName, "amendmentSize", 4)
             },
            validValues: {
              fontSize: { numberRange: { min: 10, max: 72 } }
            }
            ,
            selector: null
          });
          break;
      }

      return objectEnumeration;
    }
  }
}