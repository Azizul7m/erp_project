package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, app *App) {
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	api := e.Group("/api")
	api.POST("/register", app.HandleRegister)
	api.POST("/login", app.HandleLogin)

	protected := api.Group("")
	protected.Use(app.AuthMiddleware)
	protected.GET("/user", app.HandleCurrentUser)
	protected.GET("/customers", app.HandleListCustomers)
	protected.POST("/customers", app.HandleCreateCustomer)
	protected.PUT("/customers/:id", app.HandleUpdateCustomer)
	protected.DELETE("/customers/:id", app.HandleDeleteCustomer)
	protected.GET("/vendors", app.HandleListVendors)
	protected.POST("/vendors", app.HandleCreateVendor)
	protected.PUT("/vendors/:id", app.HandleUpdateVendor)
	protected.DELETE("/vendors/:id", app.HandleDeleteVendor)
	protected.GET("/products", app.HandleListProducts)
	protected.POST("/products", app.HandleCreateProduct)
	protected.PUT("/products/:id", app.HandleUpdateProduct)
	protected.DELETE("/products/:id", app.HandleDeleteProduct)
	protected.GET("/orders", app.HandleListOrders)
	protected.POST("/orders", app.HandleCreateOrder)
	protected.GET("/orders/:id", app.HandleGetOrder)
	protected.GET("/transactions", app.HandleListTransactions)
	protected.POST("/transactions", app.HandleCreateTransaction)
}
