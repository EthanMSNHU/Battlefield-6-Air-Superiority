import { UIContainer } from 'bf6-portal-utils/ui/components/container/index.ts';
import { UIText } from 'bf6-portal-utils/ui/components/text/index.ts';
import { TeamWrapper } from '../game/Teams.ts';
import { Colours, GameVariables } from '../helpers/Constants.ts';

const SCORE_BOX_SIZE = { width: 84, height: 33 };
const SCORE_BOX_Y_POS = 54;

const SCORE_BAR_SIZE = { width: 180, height: 12 };
const SCORE_BAR_Y_POS = 65;

export class TopBarUi {

    private container: UIContainer;

    private scoreFriendly: UIText;
    private scoreEnemy: UIText;

    private barFriendly: UIText;
    private barEnemy: UIText;

    private objIcons: UIText[] = [];

    private lastFriendlyScore = 0;
    private lastEnemyScore = 0;

    constructor(
        private player: mod.Player,
        private friendlyTeam: TeamWrapper,
        private enemyTeam: TeamWrapper
    ) {}

    public Initialize(): void {

        this.container = new UIContainer({
            position: { x: 0, y: 0 },
            size: { width: 2000, height: 2000 },
            anchor: mod.UIAnchor.TopCenter,
            bgAlpha: 0,
            receiver: this.player
        });

        // Score boxes
        this.scoreFriendly = new UIText({
            parent: this.container,
            position: { x: -234, y: SCORE_BOX_Y_POS },
            size: SCORE_BOX_SIZE,
            anchor: mod.UIAnchor.TopCenter,
            message: mod.Message(mod.stringkeys.ScoreboardTab.Score, 0),
            bgColor: Colours.FRIENDLY_BG,
            bgAlpha: 0.8,
            bgFill: mod.UIBgFill.Blur,
            textSize: 32,
            textColor: Colours.FRIENDLY_TEXT,
            receiver: this.player
        });

        this.scoreEnemy = new UIText({
            parent: this.container,
            position: { x: 234, y: SCORE_BOX_Y_POS },
            size: SCORE_BOX_SIZE,
            anchor: mod.UIAnchor.TopCenter,
            message: mod.Message(mod.stringkeys.ScoreboardTab.Score, 0),
            bgColor: Colours.ENEMY_BG,
            bgAlpha: 0.8,
            bgFill: mod.UIBgFill.Blur,
            textSize: 32,
            textColor: Colours.ENEMY_TEXT,
            receiver: this.player
        });

        // Bars
        this.barFriendly = new UIText({
            parent: this.container,
            position: { x: -94, y: SCORE_BAR_Y_POS },
            size: { width: 0, height: SCORE_BAR_SIZE.height },
            anchor: mod.UIAnchor.TopCenter,
            message: mod.Message(mod.stringkeys.empty),
            bgColor: Colours.FRIENDLY_TEXT,
            bgAlpha: 1,
            bgFill: mod.UIBgFill.Solid,
            receiver: this.player
        });

        this.barEnemy = new UIText({
            parent: this.container,
            position: { x: 94, y: SCORE_BAR_Y_POS },
            size: { width: 0, height: SCORE_BAR_SIZE.height },
            anchor: mod.UIAnchor.TopCenter,
            message: mod.Message(mod.stringkeys.empty),
            bgColor: Colours.ENEMY_TEXT,
            bgAlpha: 1,
            bgFill: mod.UIBgFill.Solid,
            receiver: this.player
        });

        // 3 Objective Icons
        for (let i = 0; i < 3; i++) {

            const icon = new UIText({
                parent: this.container,
                position: { x: (i - 1) * 50, y: 90 },
                size: { width: 30, height: 30 },
                anchor: mod.UIAnchor.TopCenter,
                message: mod.Message(mod.stringkeys.Flags.A + i),
                bgColor: Colours.BLACK,
                bgAlpha: 0.8,
                bgFill: mod.UIBgFill.Blur,
                textSize: 24,
                textColor: Colours.WHITE,
                receiver: this.player
            });

            this.objIcons.push(icon);
        }
    }

    private CalculateBarWidth(score: number): number {
        return (score / GameVariables.STARTING_SCORE) * SCORE_BAR_SIZE.width;
    }

    // 🔥 Smooth Lerp Animation
    private Lerp(current: number, target: number, speed = 0.25): number {
        return current + (target - current) * speed;
    }

    public Update(): void {

        const friendlyScore = this.friendlyTeam.score;
        const enemyScore = this.enemyTeam.score;

        // Update score text
        this.scoreFriendly.setMessage(
            mod.Message(mod.stringkeys.ScoreboardTab.Score, friendlyScore)
        );

        this.scoreEnemy.setMessage(
            mod.Message(mod.stringkeys.ScoreboardTab.Score, enemyScore)
        );

        // Pulse glow on score tick
        if (friendlyScore > this.lastFriendlyScore) {
            this.scoreFriendly.setBgAlpha(1);
        } else {
            this.scoreFriendly.setBgAlpha(0.8);
        }

        if (enemyScore > this.lastEnemyScore) {
            this.scoreEnemy.setBgAlpha(1);
        } else {
            this.scoreEnemy.setBgAlpha(0.8);
        }

        this.lastFriendlyScore = friendlyScore;
        this.lastEnemyScore = enemyScore;

        // Smooth bar animation
        const friendlyWidth = this.CalculateBarWidth(friendlyScore);
        const enemyWidth = this.CalculateBarWidth(enemyScore);

        const newFriendlyWidth = this.Lerp(
            this.barFriendly.getSize().width,
            friendlyWidth
        );

        const newEnemyWidth = this.Lerp(
            this.barEnemy.getSize().width,
            enemyWidth
        );

        this.barFriendly.setSize({
            width: newFriendlyWidth,
            height: SCORE_BAR_SIZE.height
        });

        this.barEnemy.setSize({
            width: newEnemyWidth,
            height: SCORE_BAR_SIZE.height
        });
    }

    public UpdateFlags(flags: mod.CapturePoint[]): void {

        for (let i = 0; i < 3; i++) {

            const owner = mod.GetCurrentOwnerTeam(flags[i]);
            const players = mod.GetPlayersOnPoint(flags[i]);

            const friendlyCount = mod.CountOf(players);

            if (this.friendlyTeam.equals(owner)) {
                this.objIcons[i].setBgColor(Colours.FRIENDLY_BG);
                this.objIcons[i].setTextColor(Colours.FRIENDLY_TEXT);

            } else if (this.enemyTeam.equals(owner)) {
                this.objIcons[i].setBgColor(Colours.ENEMY_BG);
                this.objIcons[i].setTextColor(Colours.ENEMY_TEXT);

            } else {
                // Neutralizing Flash Effect
                this.objIcons[i].setBgColor(Colours.WHITE);
                this.objIcons[i].setTextColor(Colours.BLACK);
            }

            // Contested (both teams on point)
            if (friendlyCount > 1) {
                this.objIcons[i].setBgAlpha(1);
            } else {
                this.objIcons[i].setBgAlpha(0.8);
            }
        }
    }
}