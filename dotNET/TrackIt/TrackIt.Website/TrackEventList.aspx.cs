using System;
using System.Collections;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI.HtmlControls;
using System.Xml.Linq;

namespace TrackIt.Website
{
	public partial class TrackEventList : System.Web.UI.Page
	{
		private int uniqueTrackId = 0;

		protected void Page_Load(object sender, EventArgs e)
		{

			XDocument myDoc = XDocument.Load(Request.MapPath("~/Assets/xml/trackingCode.xml"));
			var q = from c in myDoc.Descendants("trackEvent")
			        select new
			               	{
                                eventName = c.Attribute("eventName").Value,
								eventType = c.Attribute("event").Value,
								urlMap = c.Attribute("urlMap").Value.ToString().Replace("|", ", ")
			               	};
			TrackEventListRepeater.DataSource = q;
			TrackEventListRepeater.ItemDataBound += TrackEventListRepeater_ItemDataBound;
			TrackEventListRepeater.DataBind();
					// select (string)c.Element("firstName") + “ “ +
 					//(string)c.Element("lastName");

		}

		void TrackEventListRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
		{
			if( e.Item.ItemType == ListItemType.Item || e.Item.ItemType == ListItemType.AlternatingItem )
			{
				HtmlInputHidden hiddenFieldId = e.Item.FindControl("trackEventId") as HtmlInputHidden;
				if( hiddenFieldId != null )
				{
					hiddenFieldId.Value = (++uniqueTrackId).ToString();
				}
			}
		}
	}
}
