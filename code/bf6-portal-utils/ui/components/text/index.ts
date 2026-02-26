import { UIContainer } from '../container/index.ts';

type Vec2 = { x: number; y: number };
type Size = { width: number; height: number };

type TextParams = {
    parent?: UIContainer;
    position: Vec2;
    size: Size;
    anchor: mod.UIAnchor;
    message: mod.Message;
    visible?: boolean;
    padding?: number;
    bgColor?: mod.Vector;
    bgAlpha?: number;
    bgFill?: mod.UIBgFill;
    textSize?: number;
    textColor?: mod.Vector;
    textAlpha?: number;
    textAnchor?: mod.UIAnchor;
    receiver?: mod.Player | mod.Team;
};

let uiCounter = 0;

function toVector(position: Vec2 | Size): mod.Vector {
    if ("x" in position) {
        return mod.CreateVector(position.x, position.y, 0);
    }
    return mod.CreateVector(position.width, position.height, 0);
}

function makeName(prefix: string): string {
    uiCounter += 1;
    return `${prefix}_${uiCounter}`;
}

export class UIText {
    public readonly widget: mod.UIWidget;

    constructor(params: TextParams) {
        const name = makeName("ui_text");
        const parent = params.parent?.widget ?? mod.GetUIRoot();
        const visible = params.visible ?? true;
        const padding = params.padding ?? 0;
        const bgColor = params.bgColor ?? mod.CreateVector(0, 0, 0);
        const bgAlpha = params.bgAlpha ?? 0;
        const bgFill = params.bgFill ?? mod.UIBgFill.Solid;
        const textSize = params.textSize ?? 20;
        const textColor = params.textColor ?? mod.CreateVector(1, 1, 1);
        const textAlpha = params.textAlpha ?? 1;
        const textAnchor = params.textAnchor ?? mod.UIAnchor.Center;

        mod.AddUIText(
            name,
            toVector(params.position),
            toVector(params.size),
            params.anchor,
            parent,
            visible,
            padding,
            bgColor,
            bgAlpha,
            bgFill,
            params.message,
            textSize,
            textColor,
            textAlpha,
            textAnchor,
            params.receiver
        );

        this.widget = mod.FindUIWidgetWithName(name, parent);
    }

    public setMessage(message: mod.Message): void {
        mod.SetUITextLabel(this.widget, message);
    }

    public setBgAlpha(alpha: number): void {
        mod.SetUIWidgetBgAlpha(this.widget, alpha);
    }

    public setBgColor(color: mod.Vector): void {
        mod.SetUIWidgetBgColor(this.widget, color);
    }

    public setTextColor(color: mod.Vector): void {
        mod.SetUITextColor(this.widget, color);
    }

    public getSize(): Size {
        const size = mod.GetUIWidgetSize(this.widget);
        return { width: size.x, height: size.y };
    }

    public setSize(size: Size): void {
        mod.SetUIWidgetSize(this.widget, mod.CreateVector(size.width, size.height, 0));
    }
}
