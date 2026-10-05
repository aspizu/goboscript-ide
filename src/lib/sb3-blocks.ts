export type Primitive = [number, string | number, string?, number?, number?]
export type Input = string | Primitive | null

export interface SerializedBlock {
    opcode: string
    next: string | null
    parent: string | null
    topLevel: boolean
    shadow: boolean
    inputs?: Record<string, [number, Input, Input?]>
    fields?: Record<string, [string | number, (string | null)?]>
    mutation?: VM.Block["mutation"]
}

export type Block = Omit<VM.Block, "inputs"> & {
    inputs: Record<string, {name: string; block: string | null; shadow: string | null}>
}

export function decodeField(
    name: string,
    value: string | number,
    id: string | null = null
) {
    const variableTypes: Record<string, string> = {
        VARIABLE: "",
        LIST: "list",
        BROADCAST_OPTION: "broadcast_msg"
    }
    return {name, value: String(value), id, variableType: variableTypes[name]}
}

export function decodePrimitive(
    id: string,
    value: Primitive,
    parent: string | null
): Block {
    const primitives: Record<number, [string, string]> = {
        4: ["math_number", "NUM"],
        5: ["math_positive_number", "NUM"],
        6: ["math_whole_number", "NUM"],
        7: ["math_integer", "NUM"],
        8: ["math_angle", "NUM"],
        9: ["colour_picker", "COLOUR"],
        10: ["text", "TEXT"],
        11: ["event_broadcast_menu", "BROADCAST_OPTION"],
        12: ["data_variable", "VARIABLE"],
        13: ["data_listcontents", "LIST"]
    }
    const primitive = primitives[value[0]]
    if (!primitive) throw new Error(`Unknown SB3 primitive: ${value[0]}`)
    const [opcode, field] = primitive
    return {
        id,
        opcode,
        parent,
        next: null,
        topLevel: parent === null,
        shadow: false,
        inputs: {},
        fields: {[field]: decodeField(field, value[1], value[2])},
        mutation: null
    }
}

export function decodeBlocks(
    serialized: Record<string, SerializedBlock | Primitive>
): Block[] {
    const blocks: Block[] = []
    for (const [id, source] of Object.entries(serialized)) {
        if (Array.isArray(source)) {
            blocks.push(decodePrimitive(id, source, null))
            continue
        }
        const inputs: Block["inputs"] = {}
        for (const [name, input] of Object.entries(source.inputs ?? {})) {
            const references: (string | null)[] = []
            for (const [index, value] of [
                input[1],
                input[0] === 3 ? input[2] : null
            ].entries()) {
                if (Array.isArray(value)) {
                    const primitiveId = `${id}:${name}:${index}`
                    const primitive = decodePrimitive(primitiveId, value, id)
                    primitive.shadow = index === 1 || input[0] === 1
                    blocks.push(primitive)
                    references.push(primitiveId)
                } else {
                    references.push(value ?? null)
                }
            }
            inputs[name] = {
                name,
                block: references[0],
                shadow: input[0] === 1 ? references[0] : references[1]
            }
        }
        blocks.push({
            ...source,
            id,
            inputs,
            fields: Object.fromEntries(
                Object.entries(source.fields ?? {}).map(([name, [value, fieldId]]) => [
                    name,
                    decodeField(name, value, fieldId)
                ])
            ),
            mutation: source.mutation ?? null
        })
    }
    return blocks
}
