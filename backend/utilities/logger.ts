import chalk from 'chalk';
import { createTimestampWithoutDate } from './utilities';
import { IS_DEBUG_ENABLED, LOG_LEVEL } from "../entryPoint";

const LEVEL_COLUMN_WIDTH = 8;
const PREFIX_COLUMN_WIDTH = 30;
const TIMESTAMP_COLUMN_WIDTH = 12;

export enum LogLevel {
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    DEBUG = 'debug',
}

export enum LogColor {
    BLACK = 'black',
    RED = 'red',
    GREEN = 'green',
    YELLOW = 'yellow',
    BLUE = 'blue',
    MAGENTA = 'magenta',
    CYAN = 'cyan',
    WHITE = 'white',
    BLACK_BRIGHT = 'blackBright',
    RED_BRIGHT = 'redBright',
    GREEN_BRIGHT = 'greenBright',
    YELLOW_BRIGHT = 'yellowBright',
    BLUE_BRIGHT = 'blueBright',
    MAGENTA_BRIGHT = 'magentaBright',
    CYAN_BRIGHT = 'cyanBright',
    WHITE_BRIGHT = 'whiteBright',
}

export enum LogBackgroundColor {
    BG_BLACK = 'bgBlack',
    BG_RED = 'bgRed',
    BG_GREEN = 'bgGreen',
    BG_YELLOW = 'bgYellow',
    BG_BLUE = 'bgBlue',
    BG_MAGENTA = 'bgMagenta',
    BG_CYAN = 'bgCyan',
    BG_WHITE = 'bgWhite',
    BG_BLACK_BRIGHT = 'bgBlackBright',
    BG_RED_BRIGHT = 'bgRedBright',
    BG_GREEN_BRIGHT = 'bgGreenBright',
    BG_YELLOW_BRIGHT = 'bgYellowBright',
    BG_BLUE_BRIGHT = 'bgBlueBright',
    BG_MAGENTA_BRIGHT = 'bgMagentaBright',
    BG_CYAN_BRIGHT = 'bgCyanBright',
    BG_WHITE_BRIGHT = 'bgWhiteBright',
}

export enum LogStyle {
    BOLD = 'bold',
    DIM = 'dim',
    ITALIC = 'italic',
    UNDERLINE = 'underline',
    INVERSE = 'inverse',
}

interface LoggerOptions {
    color?: LogColor;
    backgroundColor?: LogBackgroundColor;
    style?: LogStyle;
}

interface LoggerArguments {
    message: string;
    logPrefix: string;
    options?: LoggerOptions;
}

class Logger {
    private levelColors: Record<LogLevel, (text: string) => string> = {} as Record<LogLevel, (text: string) => string>;

    constructor() {
        this.initialize();
    }

    private initialize() {
        this.levelColors = {
            [LogLevel.INFO]: chalk.blue,
            [LogLevel.WARN]: chalk.yellow,
            [LogLevel.ERROR]: chalk.red,
            [LogLevel.DEBUG]: chalk.green,
        };
    }

    private applyStyle(text: string, style?: LogStyle): string {
        switch (style) {
            case LogStyle.BOLD:
                return chalk.bold(text);
            case LogStyle.DIM:
                return chalk.dim(text);
            case LogStyle.ITALIC:
                return chalk.italic(text);
            case LogStyle.UNDERLINE:
                return chalk.underline(text);
            case LogStyle.INVERSE:
                return chalk.inverse(text);
            default:
                return text;
        }
    }

    private applyBackground(text: string, backgroundColor?: LogBackgroundColor): string {
        switch (backgroundColor) {
            case LogBackgroundColor.BG_BLACK:
                return chalk.bgBlack(text);
            case LogBackgroundColor.BG_RED:
                return chalk.bgRed(text);
            case LogBackgroundColor.BG_GREEN:
                return chalk.bgGreen(text);
            case LogBackgroundColor.BG_YELLOW:
                return chalk.bgYellow(text);
            case LogBackgroundColor.BG_BLUE:
                return chalk.bgBlue(text);
            case LogBackgroundColor.BG_MAGENTA:
                return chalk.bgMagenta(text);
            case LogBackgroundColor.BG_CYAN:
                return chalk.bgCyan(text);
            case LogBackgroundColor.BG_WHITE:
                return chalk.bgWhite(text);
            case LogBackgroundColor.BG_BLACK_BRIGHT:
                return chalk.bgBlackBright(text);
            case LogBackgroundColor.BG_RED_BRIGHT:
                return chalk.bgRedBright(text);
            case LogBackgroundColor.BG_GREEN_BRIGHT:
                return chalk.bgGreenBright(text);
            case LogBackgroundColor.BG_YELLOW_BRIGHT:
                return chalk.bgYellowBright(text);
            case LogBackgroundColor.BG_BLUE_BRIGHT:
                return chalk.bgBlueBright(text);
            case LogBackgroundColor.BG_MAGENTA_BRIGHT:
                return chalk.bgMagentaBright(text);
            case LogBackgroundColor.BG_CYAN_BRIGHT:
                return chalk.bgCyanBright(text);
            case LogBackgroundColor.BG_WHITE_BRIGHT:
                return chalk.bgWhiteBright(text);
            default:
                return text;
        }
    }

    private shouldDisplayLog(level: LogLevel): boolean {
        const levels: LogLevel[] = [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const currentLevelIndex = levels.indexOf(LOG_LEVEL as LogLevel);
        const logLevelIndex = levels.indexOf(level);

        const isLevelValid = logLevelIndex >= currentLevelIndex;
        const shouldShowDebug = IS_DEBUG_ENABLED && level === LogLevel.DEBUG;

        return isLevelValid || shouldShowDebug;
    }

    log({ message, logPrefix, options }: LoggerArguments, level: LogLevel): void {
        const { color, backgroundColor, style } = options || {};

        if (!this.shouldDisplayLog(level)) {
            return;
        }

        const colorizer = color ? (chalk[color] as (text: string) => string) : this.levelColors[level];
        const timestamp = createTimestampWithoutDate();

        const levelAligned = `[${level.toUpperCase()}]`.padEnd(LEVEL_COLUMN_WIDTH, ' ');
        const prefixAligned = `[${logPrefix}]`.padEnd(PREFIX_COLUMN_WIDTH, ' ');
        const timestampAligned = `[${timestamp}]`.padStart(TIMESTAMP_COLUMN_WIDTH, ' ');
        const prefix = `${levelAligned}${prefixAligned}${timestampAligned}`;
        let styledPrefix = colorizer(prefix);
        styledPrefix = this.applyStyle(styledPrefix, style);

        let styledMessage = colorizer(message);
        styledMessage = this.applyBackground(styledMessage, backgroundColor);
        styledMessage = this.applyStyle(styledMessage, style);

        console.log(`${styledPrefix} ${styledMessage}`);
    }

    info(message: string, logPrefix: string, options?: LoggerOptions): void {
        this.log({ message, logPrefix, options }, LogLevel.INFO);
    }

    warn(message: string, logPrefix: string, options?: LoggerOptions): void {
        this.log({ message, logPrefix, options }, LogLevel.WARN);
    }

    error(message: string, logPrefix: string, options?: LoggerOptions): void {
        this.log({ message, logPrefix, options }, LogLevel.ERROR);
    }

    debug(message: string, logPrefix: string, options?: LoggerOptions): void {
        this.log({ message, logPrefix, options }, LogLevel.DEBUG);
    }
}
export const logger = new Logger();
