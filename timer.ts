
export class Timer {

    public start_time: number;
    public previous_time: number;

    public checkpoints: Record<string, {
        delay: number;
        delay_percent?: number;
        total: number;
    }> = {};

    protected constructor(start_time: number) {
        this.start_time = start_time;
        this.previous_time = start_time;
    }

    static start(): Timer {
        return new Timer(Date.now());
    }

    checkpoint(name: string) {
        const now = Date.now();
        this.checkpoints[name] = {
            delay: now - this.previous_time,
            total: now - this.start_time,
        };
        this.previous_time = now;
    }

    log() {
        const total_percent = (this.previous_time - this.start_time) / 100;
        Object.values(this.checkpoints).forEach(checkpoint => {
            checkpoint.delay_percent = checkpoint.delay / total_percent;
        });
        console.table(this.checkpoints);
    }
}
