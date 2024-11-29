import { useNavigate } from "react-router-dom"
import { useEffect } from "react";
const NotFound = () => {
    const nav = useNavigate()
    useEffect(() => {
        nav('/menu');
    }, [nav]);

    return null; 
}
export default NotFound