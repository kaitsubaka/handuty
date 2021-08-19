import {useState} from "react";
import {userContext} from './context/User';
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";
import ServiciosDetail from "./pages/ServiciosDetail";
import ServiciosFilter from "./pages/ServiciosFilter";
import CrearServicio from './pages/CrearServicio';
import CrearReserva from './pages/CrearReserva';
import Messenger from "./pages/Messenger";
import Registro from './pages/Registro';
import Ingreso from './pages/Ingreso';
import Citas from "./pages/Citas";
import Servicios from "./pages/Servicios";
import Inicio from "./pages/Inicio";
import Principal from "./pages/Principal";
import "./App.css"; 


function App(){

    const [user, setUser] = useState(JSON.parse(localStorage.getItem("usuario")) || {});

    return (
        <div className="App">
            <userContext.Provider value={{ user, setUser }}>
                <Router>
                    <Switch>
                        <Route path="/" exact component={Principal}/>
                        <Route path="/landing" component={Principal}/>
                        <Route path="/login" exact component={Ingreso}/>
                        <Route path="/register" component={Registro}/>
                        <Route path="/home" component={Inicio}/>
                        <Route path="/apointments" component={Citas}/>
                        <Route path="/services" component={Servicios}/>
                        <Route path="/services-detail" component={ServiciosDetail}/>
                        <Route path="/services-filter/:id" component={ServiciosFilter}/>
                        <Route path="/messages" component={Messenger}></Route>
                        <Route path="/reservation-create" component={CrearReserva}/>
                        <Route path="/service-create" component={CrearServicio}/>
                    </Switch>
                </Router>
            </userContext.Provider>
        </div>
    );
}


export default App;