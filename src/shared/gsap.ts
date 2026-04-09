import gsap from "gsap";

export function useGsap(root: any){
    let ctx:any

    const init = (fn: any) => {
        ctx = gsap.context(fn, root.value)
    }

    const cleanup = () => {
        ctx?.revert()
    }

    return {init, cleanup}
}