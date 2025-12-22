export interface AdminInterface {
    id: string
    name: string
    username: string
    password: string
    role: string
    status: string
}

export interface FormInputs {
    id: string,
    name: string,
    username: string,
    password: string,
    confirmPassword: string,
    role: string
}