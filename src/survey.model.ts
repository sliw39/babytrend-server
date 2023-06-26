
export type SurveyType = "Change" | "Someil" | "Bain" | "Repas" | "Visite" | "Medicaments";
export interface Survey {
    _id?: string,
    date: number,
    type: SurveyType,
    weight?: number,
    height?: number,
    poop?: boolean,
    pee?: boolean,
    eat?: boolean,
    blurp?: boolean,
    temperature?: number,
    commentaire?: string,
}

export interface SurveyQuery {
    dateFrom?: number,
    dateTo?: number,
    type?: SurveyType,
    minWeight?: number,
    minHeight?: number,
    minTemperature?: number,
    blurp?: boolean,
    poop?: boolean,
    pee?: boolean,
    eat?: boolean,
}

export function validateQuery(query: SurveyQuery): boolean {
    if (!query) return false;
    // validate type and requirements
    if (query.type && !["Change", "Someil", "Bain", "Repas", "Visite", "Medicaments"].includes(query.type)) return false;
    if (query.dateFrom && isNaN(query.dateFrom)) return false;
    if (query.dateTo && isNaN(query.dateTo)) return false;
    if (query.minWeight && isNaN(query.minWeight)) return false;
    if (query.minHeight && isNaN(query.minHeight)) return false;
    if (query.minTemperature && isNaN(query.minTemperature)) return false;
    if (query.blurp && typeof query.blurp !== "boolean") return false;
    if (query.poop && typeof query.poop !== "boolean") return false;
    if (query.pee && typeof query.pee !== "boolean") return false;
    if (query.eat && typeof query.eat !== "boolean") return false;

    // validate constraints
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) return false;
    if (query.minWeight && query.minHeight && query.minWeight > query.minHeight) return false;
    return true;
}

export function validateSurvey(survey: Survey): boolean {
    if (!survey) return false;
    if (survey._id && typeof survey._id !== "string") return false;
    if (isNaN(survey.date)) return false;
    if (!["Change", "Someil", "Bain", "Repas", "Visite", "Medicaments"].includes(survey.type)) return false;
    if (survey.weight && isNaN(survey.weight)) return false;
    if (survey.height && isNaN(survey.height)) return false;
    if (survey.temperature && isNaN(survey.temperature)) return false;
    if (survey.blurp && typeof survey.blurp !== "boolean") return false;
    if (survey.poop && typeof survey.poop !== "boolean") return false;
    if (survey.pee && typeof survey.pee !== "boolean") return false;
    if (survey.eat && typeof survey.eat !== "boolean") return false;
    return true;
}

export interface SurveyCriterias {
    max?: number,
    skip?: number,
    sortBy?: {key: string, order: 'asc'|'desc'}[],
}

export function n2b(value: number | null | undefined): boolean | undefined {
    if (value === null || value === undefined) return undefined;
    return value === 1;
}

export function b2n(value: boolean | undefined): number | null {
    if (value === null || value === undefined) return null;
    return value ? 1 : 0;
}

export function sqlToJson(data: any): Survey {
    let d = {
        _id: data._id,
        date: data.date,
        type: data.type,
        weight: data.weight,
        height: data.height,
        poop: n2b(data.poop),
        pee: n2b(data.pee),
        eat: n2b(data.eat),
        blurp: n2b(data.blurp),
        temperature: data.temperature,
        commentaire: data.commentaire,
    }
    for(let key in d) {
        if (d[key] === null || d[key] === undefined) delete d[key];
    }
    return d;
}

export function jsonToSql(data: Survey): any {
    return {
        _id: data._id,
        date: data.date,
        type: data.type,
        weight: data.weight,
        height: data.height,
        poop: b2n(data.poop),
        pee: b2n(data.pee),
        eat: b2n(data.eat),
        blurp: b2n(data.blurp),
        temperature: data.temperature,
        commentaire: data.commentaire,
    }
}