import java.io.*;
import java.util.ArrayList;
import java.lang.Math;

public class ConversionOfCoordinatesMoon
{
	public ConversionOfCoordinatesMoon(){

	}
	public void convert()
	{
		double a = Math.sqrt(2)/2;
		double b = Math.sqrt(2/3);
		double c = 1/(Math.sqrt(6));

		try{
			FileReader file = new FileReader("/Users/wissam/gadget/sismondi/moon3d.txt");
			PrintWriter writerAll = new PrintWriter("/Users/wissam/gadget/sismondi/moon2d.txt");
			PrintWriter writer = new PrintWriter("/Users/wissam/gadget/sismondi/plot_moon.txt");
			BufferedReader br = new BufferedReader(file);
			String line = new String();
			String delim = ",+[ ]+";

			//Parameters from the file
			ArrayList<String> t = new ArrayList<String>();
			ArrayList<Double> x = new ArrayList<Double>();
			ArrayList<Double> y = new ArrayList<Double>();
			ArrayList<Double> z = new ArrayList<Double>();

			//New coordinates
			ArrayList<Double> x_n = new ArrayList<Double>();
			ArrayList<Double> y_n = new ArrayList<Double>();

			while((line = br.readLine())!=null){
				String[] tokens = line.split(delim);
				 t.add(tokens[1]);
				 x.add(Double.parseDouble(tokens[2]));
				 y.add(Double.parseDouble(tokens[3]));
				 z.add(Double.parseDouble(tokens[4]));
			}

			writer.print("[");
			for(int i=0;i<t.size();i++){	
				float xn = (float)(a*(x.get(i) - y.get(i)));
				float yn = (float)(b*z.get(i) - c*(x.get(i) + y.get(i)));
				writerAll.print(t.get(i) + ", " + xn + ", " + yn + "\n");
				writer.print("[" + xn + "," + yn + "],");
			}
			writer.print("]");
			writer.close();
			writerAll.close();
			br.close();

		}catch(FileNotFoundException exception){
			System.out.println("File not in directroy");
		}catch(IOException io){
			System.out.println("Something wrong with IO");
		}
	}
public static void main(String args[])
	{
		ConversionOfCoordinatesMoon con = new ConversionOfCoordinatesMoon();
		con.convert();
	}
}