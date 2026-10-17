package com.portfoliopro.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    @GetMapping({"/", "/login", "/overview", "/portfolio", "/markets", "/analysis", "/risk", "/orders"})
    public String forwardToAngular() {
        return "forward:/index.html";
    }
}
