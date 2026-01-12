/**
 * Example page component - you can customize this however you want!
 */
export const Page1 = () => {
  return (
    <div style={{ 
      width: "100%", 
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "30px",
    }}>
      <h1 style={{
        fontSize: "48px",
        fontWeight: "bold",
        margin: 0,
        color: "#000",
      }}>
        My Journal Entry
      </h1>
      
      <p style={{
        fontSize: "24px",
        lineHeight: "1.6",
        color: "#333",
        margin: 0,
      }}>
        Today I started working on my digital diary. This is so exciting! 
        I can write anything I want here and it will appear on the 3D book pages.
      </p>
      
      <p style={{
        fontSize: "24px",
        lineHeight: "1.6",
        color: "#333",
        margin: 0,
      }}>
        The pages look beautiful and I can add images, text, and any content I want.
        This is much better than creating Photoshop images for each page!
      </p>
      
      <div style={{
        marginTop: "20px",
        padding: "20px",
        background: "#f5f5f5",
        borderRadius: "8px",
      }}>
        <p style={{
          fontSize: "20px",
          fontStyle: "italic",
          color: "#666",
          margin: 0,
        }}>
          "The best way to predict the future is to create it."
        </p>
      </div>
    </div>
  );
};
