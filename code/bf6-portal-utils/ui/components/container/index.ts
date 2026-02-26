type Vec2 = { x: number; y: number };
type Size = { width: number; height: number };

type ContainerParams = {
    parent?: UIContainer;
    position: Vec2;
    size: Size;
    anchor: mod.UIAnchor;
    visible?: boolean;
    padding?: number;
    bgColor?: mod.Vector;
    bgAlpha?: number;
    bgFill?: mod.UIBgFill;
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

export class UIContainer {
    public readonly widget: mod.UIWidget;

    constructor(params: ContainerParams) {
        const name = makeName("ui_container");
        const parent = params.parent?.widget ?? mod.GetUIRoot();
        const visible = params.visible ?? true;
        const padding = params.padding ?? 0;
        const bgColor = params.bgColor ?? mod.CreateVector(0, 0, 0);
        const bgAlpha = params.bgAlpha ?? 0;
        const bgFill = params.bgFill ?? mod.UIBgFill.Solid;

        mod.AddUIContainer(
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
            params.receiver
        );

        this.widget = mod.FindUIWidgetWithName(name, parent);
    }
}
