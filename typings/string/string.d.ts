//TODO(wg): Make this not horrible, right now it's just here so this all compiles

declare module 'string' {
    function string(input: string): StringClass;

    interface StringClassOutput {
        s: string;
    }

    interface StringClass {
        stripTags(): StringClassOutput;
    }

    export = string;
}