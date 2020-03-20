using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaseController : ControllerBase
    {
        private IMediator _meditator;
        protected IMediator Mediator => _meditator ?? (_meditator = HttpContext.RequestServices.GetService<IMediator>());
    }
}